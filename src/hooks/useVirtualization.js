import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Custom hook for virtualization
 * Provides efficient rendering for large lists using windowing
 */
const useVirtualization = (options = {}) => {
  const {
    itemHeight = 60, // Default item height in pixels
    overscan = 3, // Number of items to render outside the visible area
    minItems = 5, // Minimum number of items to render
  } = options;

  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [items, setItems] = useState([]);

  // Measure container height
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (!containerHeight || items.length === 0) {
      return { start: 0, end: minItems };
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleItemCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
    const endIndex = Math.min(items.length, startIndex + visibleItemCount);

    return {
      start: startIndex,
      end: endIndex,
      visibleCount: endIndex - startIndex,
    };
  }, [scrollTop, containerHeight, items.length, itemHeight, overscan, minItems]);

  // Get item style for virtualization
  const getItemStyle = useCallback((index) => {
    return {
      position: 'absolute',
      top: index * itemHeight,
      left: 0,
      right: 0,
      height: itemHeight,
    };
  }, [itemHeight]);

  // Handle scroll
  const handleScroll = useCallback((e) => {
    const scrollTop = e.target.scrollTop;
    setScrollTop(scrollTop);
  }, []);

  // Set items to virtualize
  const setVirtualItems = useCallback((newItems) => {
    setItems(newItems || []);
  }, []);

  // Scroll to item
  const scrollToItem = useCallback((index, behavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;

    const scrollPosition = index * itemHeight;
    container.scrollTo({
      top: scrollPosition,
      behavior,
    });
  }, [itemHeight]);

  // Scroll to top
  const scrollToTop = useCallback((behavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: 0,
      behavior,
    });
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  }, []);

  // Get total height for spacer
  const totalHeight = useMemo(() => {
    return items.length * itemHeight;
  }, [items.length, itemHeight]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  // Get offset for visible items
  const offsetY = useMemo(() => {
    return visibleRange.start * itemHeight;
  }, [visibleRange.start, itemHeight]);

  // Reset scroll position
  const resetScroll = useCallback(() => {
    setScrollTop(0);
  }, []);

  return {
    // Refs
    containerRef,
    
    // State
    scrollTop,
    containerHeight,
    items,
    
    // Computed
    visibleRange,
    visibleItems,
    totalHeight,
    offsetY,
    
    // Actions
    setVirtualItems,
    handleScroll,
    scrollToItem,
    scrollToTop,
    scrollToBottom,
    resetScroll,
    
    // Helpers
    getItemStyle,
    isAtTop: scrollTop === 0,
    isAtBottom: scrollTop >= totalHeight - containerHeight,
  };
};

/**
 * Create a simple virtualized list component
 * @param {Object} options - Virtualization options
 * @returns {Object} Virtual list helpers and render function
 */
export const createVirtualList = (options = {}) => {
  const hook = useVirtualization(options);

  const VirtualList = ({ 
    items, 
    renderItem, 
    containerProps = {},
    itemKey,
  }) => {
    const { 
      containerRef, 
      handleScroll, 
      visibleItems, 
      totalHeight, 
      offsetY,
      setVirtualItems,
    } = hook;

    useEffect(() => {
      setVirtualItems(items);
    }, [items, setVirtualItems]);

    return (
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          overflowY: 'auto',
          position: 'relative',
          ...containerProps.style,
        }}
        {...containerProps}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map((item, index) => (
            <div
              key={itemKey ? itemKey(item) : index}
              style={{
                position: 'absolute',
                top: offsetY + index * options.itemHeight,
                left: 0,
                right: 0,
                height: options.itemHeight,
              }}
            >
              {renderItem(item, hook)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return {
    ...hook,
    VirtualList,
  };
};

/**
 * Create a grid virtualizer
 * @param {Object} options - Virtualization options for grid
 * @returns {Object} Grid virtualizer helpers
 */
export const useVirtualGrid = (options = {}) => {
  const {
    itemWidth = 200,
    itemHeight = 150,
    overscan = 2,
  } = options;

  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [items, setItems] = useState([]);

  // Calculate columns
  const columns = useMemo(() => {
    return Math.max(1, Math.floor(containerWidth / itemWidth));
  }, [containerWidth, itemWidth]);

  // Measure container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (!containerHeight || items.length === 0) {
      return { start: 0, end: columns * Math.ceil(minItems / columns) };
    }

    const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleRowCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
    const endRow = Math.min(Math.ceil(items.length / columns), startRow + visibleRowCount);

    return {
      startRow,
      endRow,
      startIndex: startRow * columns,
      endIndex: Math.min(items.length, endRow * columns),
    };
  }, [scrollTop, containerHeight, items.length, columns, itemHeight, overscan]);

  // Get item position
  const getItemPosition = useCallback((index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    return {
      x: col * itemWidth,
      y: row * itemHeight,
      width: itemWidth,
      height: itemHeight,
    };
  }, [columns, itemWidth, itemHeight]);

  // Total height for spacer
  const totalHeight = useMemo(() => {
    const rows = Math.ceil(items.length / columns);
    return rows * itemHeight;
  }, [items.length, columns, itemHeight]);

  // Handle scroll
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Set items
  const setGridItems = useCallback((newItems) => {
    setItems(newItems || []);
  }, []);

  // Scroll to item
  const scrollToIndex = useCallback((index, behavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;

    const position = getItemPosition(index);
    container.scrollTo({
      top: position.y,
      behavior,
    });
  }, [getItemPosition]);

  return {
    containerRef,
    scrollTop,
    containerWidth,
    containerHeight,
    items,
    columns,
    visibleRange,
    totalHeight,
    getItemPosition,
    handleScroll,
    setGridItems,
    scrollToIndex,
  };
};

export default useVirtualization;