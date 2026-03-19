/**
 * Testing helpers
 * Comprehensive utilities for testing NotesApp functionality
 */

/**
 * Mock data generators
 */
export const MockDataGenerator = {
  /**
   * Generate mock note
   */
  generateNote(overrides = {}) {
    const statuses = ['todo', 'in_progress', 'completed'];
    const priorities = ['low', 'medium', 'high'];
    
    return {
      $id: this.generateId(),
      title: this.generateSentence(3, 8),
      content: this.generateParagraph(1, 3),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      tags: this.generateTags(1, 3),
      tasks: this.generateTasks(0, 5),
      isArchived: Math.random() < 0.2,
      isImportant: Math.random() < 0.3,
      isDeleted: false,
      dueDate: this.generateRandomDate(),
      $createdAt: this.generateRandomDate(-365, 0),
      $updatedAt: this.generateRandomDate(-30, 0),
      ...overrides,
    };
  },

  /**
   * Generate multiple notes
   */
  generateNotes(count, overrides = {}) {
    return Array.from({ length: count }, (_, index) => 
      this.generateNote({ ...overrides, index })
    );
  },

  /**
   * Generate mock tag
   */
  generateTag(overrides = {}) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    
    return {
      id: this.generateId(),
      name: this.generateWord(1).toUpperCase(),
      color: colors[Math.floor(Math.random() * colors.length)],
      count: Math.floor(Math.random() * 20),
      createdAt: this.generateRandomDate(-180, 0),
      ...overrides,
    };
  },

  /**
   * Generate multiple tags
   */
  generateTags(count, overrides = {}) {
    return Array.from({ length: count }, () => this.generateTag(overrides));
  },

  /**
   * Generate mock reminder
   */
  generateReminder(overrides = {}) {
    const noteId = this.generateId();
    
    return {
      id: this.generateId(),
      noteId,
      reminderTime: this.generateRandomDate(1, 30),
      message: this.generateSentence(5, 15),
      status: 'pending',
      createdAt: this.generateRandomDate(-30, 0),
      ...overrides,
    };
  },

  /**
   * Generate multiple reminders
   */
  generateReminders(count, overrides = {}) {
    return Array.from({ length: count }, () => this.generateReminder(overrides));
  },

  /**
   * Generate mock task
   */
  generateTask(overrides = {}) {
    return {
      id: this.generateId(),
      text: this.generateSentence(3, 10),
      completed: Math.random() < 0.6,
      createdAt: this.generateRandomDate(-30, 0),
      ...overrides,
    };
  },

  /**
   * Generate multiple tasks
   */
  generateTasks(count, overrides = {}) {
    return Array.from({ length: count }, () => this.generateTask(overrides));
  },

  /**
   * Generate mock gamification data
   */
  generateGamification(overrides = {}) {
    const badges = [
      { id: 'first_note', name: 'First Steps', earnedAt: this.generateRandomDate(-30, 0) },
      { id: 'note_collector', name: 'Note Collector', earnedAt: this.generateRandomDate(-20, 0) },
    ];
    
    return {
      points: Math.floor(Math.random() * 1000),
      level: Math.floor(Math.random() * 10) + 1,
      xp: Math.floor(Math.random() * 1000),
      badges: badges.slice(0, Math.floor(Math.random() * badges.length)),
      currentStreak: Math.floor(Math.random() * 30),
      bestStreak: Math.floor(Math.random() * 50) + 30,
      specialStreaks: {
        taskStreak: Math.floor(Math.random() * 15),
        kanbanStreak: Math.floor(Math.random() * 10),
      },
      lastActivityDate: this.generateRandomDate(-7, 0),
      stats: {
        notesCreated: Math.floor(Math.random() * 200),
        tasksCompleted: Math.floor(Math.random() * 500),
        tagsCreated: Math.floor(Math.random() * 20),
      },
      ...overrides,
    };
  },

  /**
   * Generate mock settings
   */
  generateSettings(overrides = {}) {
    return {
      theme: 'dark',
      gamificationEnabled: Math.random() < 0.8,
      remindersEnabled: Math.random() < 0.9,
      tagsEnabled: Math.random() < 0.95,
      notificationsEnabled: Math.random() < 0.7,
      activityTrackingEnabled: Math.random() < 0.9,
      autoSave: true,
      language: 'en',
      fontSize: 'medium',
      compactMode: false,
      showCompletedTasks: true,
      ...overrides,
    };
  },

  /**
   * Generate random ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  },

  /**
   * Generate random word
   */
  generateWord(minLength = 3, maxLength = 10) {
    const words = [
      'project', 'task', 'note', 'idea', 'meeting', 'deadline', 'goal', 'plan',
      'review', 'update', 'create', 'design', 'develop', 'test', 'deploy',
      'feature', 'bug', 'issue', 'solution', 'improvement', 'optimization',
      'research', 'analysis', 'report', 'presentation', 'documentation',
    ];
    
    let word = words[Math.floor(Math.random() * words.length)];
    while (word.length < minLength || word.length > maxLength) {
      word = words[Math.floor(Math.random() * words.length)];
    }
    
    return word;
  },

  /**
   * Generate random sentence
   */
  generateSentence(minWords = 5, maxWords = 15) {
    const wordCount = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
    const words = Array.from({ length: wordCount }, () => this.generateWord());
    
    return words.join(' ').charAt(0).toUpperCase() + words.join(' ').slice(1) + '.';
  },

  /**
   * Generate random paragraph
   */
  generateParagraph(minSentences = 2, maxSentences = 5) {
    const sentenceCount = Math.floor(Math.random() * (maxSentences - minSentences + 1)) + minSentences;
    const sentences = Array.from({ length: sentenceCount }, () => this.generateSentence());
    
    return sentences.join(' ');
  },

  /**
   * Generate random date
   */
  generateRandomDate(minDaysAgo = -365, maxDaysAgo = 365) {
    const now = new Date();
    const minTime = now.getTime() + (minDaysAgo * 24 * 60 * 60 * 1000);
    const maxTime = now.getTime() + (maxDaysAgo * 24 * 60 * 60 * 1000);
    const randomTime = Math.random() * (maxTime - minTime) + minTime;
    
    return new Date(randomTime).toISOString();
  },
};

/**
 * Test state utilities
 */
export const TestState = {
  /**
   * Create isolated test environment
   */
  createTestEnvironment() {
    const testStorage = new Map();
    const originalLocalStorage = window.localStorage;
    
    // Mock localStorage
    window.localStorage = {
      getItem: (key) => testStorage.get(key) || null,
      setItem: (key, value) => testStorage.set(key, value),
      removeItem: (key) => testStorage.delete(key),
      clear: () => testStorage.clear(),
      get length() { return testStorage.size; },
      key: (index) => Array.from(testStorage.keys())[index] || null,
    };
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
    
    return {
      cleanup: () => {
        window.localStorage = originalLocalStorage;
        testStorage.clear();
      },
      getStorage: () => testStorage,
    };
  },

  /**
   * Setup mock network conditions
   */
  setupNetworkConditions(conditions = {}) {
    const {
      online = true,
      latency = 0,
      uploadSpeed = Infinity,
      downloadSpeed = Infinity,
      errorRate = 0,
    } = conditions;
    
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: online,
    });
    
    // Mock fetch for network conditions
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      // Simulate latency
      if (latency > 0) {
        await new Promise(resolve => setTimeout(resolve, latency));
      }
      
      // Simulate errors
      if (Math.random() < errorRate) {
        throw new Error('Network error simulated');
      }
      
      return originalFetch(...args);
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  },

  /**
   * Setup mock permissions
   */
  setupMockPermissions(permissions = {}) {
    const defaultPermissions = {
      notifications: true,
      camera: false,
      microphone: false,
      geolocation: false,
    };
    
    const mockPermissions = { ...defaultPermissions, ...permissions };
    
    // Mock permissions API
    navigator.permissions = {
      query: ({ name }) => {
        return Promise.resolve({
          state: mockPermissions[name] ? 'granted' : 'denied',
          addEventListener: () => {},
          removeEventListener: () => {},
        });
      },
    };
    
    // Mock notifications API
    if (!mockPermissions.notifications) {
      window.Notification = {
        requestPermission: () => Promise.resolve('denied'),
        permission: 'denied',
      };
    }
  },

  /**
   * Setup mock device characteristics
   */
  setupMockDevice(device = {}) {
    const defaultDevice = {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      screenWidth: 375,
      screenHeight: 667,
      isMobile: true,
      isTablet: false,
    };
    
    const mockDevice = { ...defaultDevice, ...device };
    
    // Mock userAgent
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: mockDevice.userAgent,
    });
    
    // Mock screen dimensions
    Object.defineProperty(screen, 'width', {
      writable: true,
      value: mockDevice.screenWidth,
    });
    
    Object.defineProperty(screen, 'height', {
      writable: true,
      value: mockDevice.screenHeight,
    });
    
    // Mock device detection
    window.isMobile = mockDevice.isMobile;
    window.isTablet = mockDevice.isTablet;
  },
};

/**
 * Automated test runners
 */
export class TestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
    this.isRunning = false;
  }

  /**
   * Register a test
   */
  registerTest(name, testFn, options = {}) {
    this.tests.push({
      name,
      testFn,
      timeout: options.timeout || 5000,
      retries: options.retries || 0,
      category: options.category || 'general',
    });
  }

  /**
   * Run all tests
   */
  async runAllTests(categories = null) {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;
    this.results = [];
    
    const testsToRun = categories 
      ? this.tests.filter(test => categories.includes(test.category))
      : this.tests;

    console.log(`Running ${testsToRun.length} tests...`);

    for (const test of testsToRun) {
      await this.runSingleTest(test);
    }

    this.isRunning = false;
    
    const summary = this.generateSummary();
    console.log('Test results:', summary);
    
    return summary;
  }

  /**
   * Run a single test
   */
  async runSingleTest(test) {
    const result = {
      name: test.name,
      category: test.category,
      passed: false,
      error: null,
      duration: 0,
      retries: 0,
    };

    for (let attempt = 0; attempt <= test.retries; attempt++) {
      try {
        const startTime = Date.now();
        
        // Run test with timeout
        await Promise.race([
          test.testFn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Test timeout')), test.timeout)
          ),
        ]);
        
        result.duration = Date.now() - startTime;
        result.passed = true;
        result.retries = attempt;
        
        console.log(`✓ ${test.name} (${result.duration}ms)`);
        break;
      } catch (error) {
        result.error = error.message;
        
        if (attempt < test.retries) {
          console.log(`⚠ ${test.name} failed, retrying... (${attempt + 1}/${test.retries})`);
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          console.log(`✗ ${test.name} failed: ${error.message}`);
        }
      }
    }

    this.results.push(result);
    return result;
  }

  /**
   * Generate test summary
   */
  generateSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    const summary = {
      total: this.results.length,
      passed,
      failed,
      passRate: Math.round((passed / this.results.length) * 100),
      totalDuration,
      averageDuration: Math.round(totalDuration / this.results.length),
      results: this.results,
      categories: this.groupResultsByCategory(),
    };
    
    return summary;
  }

  /**
   * Group results by category
   */
  groupResultsByCategory() {
    const categories = {};
    
    this.results.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = {
          total: 0,
          passed: 0,
          failed: 0,
        };
      }
      
      categories[result.category].total++;
      if (result.passed) {
        categories[result.category].passed++;
      } else {
        categories[result.category].failed++;
      }
    });
    
    return categories;
  }
}

/**
 * Test scenarios for common functionality
 */
export const TestScenarios = {
  /**
   * Test CRUD operations
   */
  async testCRUDOperations(createFn, readFn, updateFn, deleteFn) {
    const testItem = MockDataGenerator.generateNote();
    let createdItem;
    
    // Create
    createdItem = await createFn(testItem);
    if (!createdItem || !createdItem.id) {
      throw new Error('Create operation failed');
    }
    
    // Read
    const readItem = await readFn(createdItem.id);
    if (!readItem || readItem.id !== createdItem.id) {
      throw new Error('Read operation failed');
    }
    
    // Update
    const updateData = { title: 'Updated Title' };
    const updatedItem = await updateFn(createdItem.id, updateData);
    if (!updatedItem || updatedItem.title !== 'Updated Title') {
      throw new Error('Update operation failed');
    }
    
    // Delete
    const deleteResult = await deleteFn(createdItem.id);
    if (!deleteResult) {
      throw new Error('Delete operation failed');
    }
    
    // Verify deletion
    const deletedItem = await readFn(createdItem.id);
    if (deletedItem) {
      throw new Error('Item still exists after deletion');
    }
    
    return true;
  },

  /**
   * Test data validation
   */
  async testDataValidation(validateFn, validData, invalidData) {
    // Test valid data
    const validResult = await validateFn(validData);
    if (!validResult.isValid) {
      throw new Error('Valid data was rejected');
    }
    
    // Test invalid data
    const invalidResult = await validateFn(invalidData);
    if (invalidResult.isValid) {
      throw new Error('Invalid data was accepted');
    }
    
    return true;
  },

  /**
   * Test error handling
   */
  async testErrorHandling(operationFn, expectedErrorType = null) {
    try {
      await operationFn();
      throw new Error('Expected error was not thrown');
    } catch (error) {
      if (expectedErrorType && !(error instanceof expectedErrorType)) {
        throw new Error(`Expected ${expectedErrorType.name}, got ${error.constructor.name}`);
      }
      return true;
    }
  },

  /**
   * Test performance
   */
  async testPerformance(operationFn, maxDuration = 1000) {
    const iterations = 10;
    const durations = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await operationFn();
      const duration = Date.now() - startTime;
      durations.push(duration);
    }
    
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / iterations;
    
    if (averageDuration > maxDuration) {
      throw new Error(`Performance threshold exceeded: ${averageDuration}ms > ${maxDuration}ms`);
    }
    
    return {
      averageDuration,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      iterations,
    };
  },

  /**
   * Test offline functionality
   */
  async testOfflineOperation(onlineOperation, offlineOperation) {
    const cleanup = TestState.setupNetworkConditions({ online: false });
    
    try {
      await offlineOperation();
      return true;
    } finally {
      cleanup();
    }
  },

  /**
   * Test concurrent operations
   */
  async testConcurrentOperations(operationFn, concurrency = 5) {
    const promises = Array.from({ length: concurrency }, (_, i) => 
      operationFn(i)
    );
    
    const results = await Promise.allSettled(promises);
    const failed = results.filter(r => r.status === 'rejected').length;
    
    if (failed > 0) {
      throw new Error(`${failed} out of ${concurrency} concurrent operations failed`);
    }
    
    return true;
  },
};

/**
 * Test data cleanup utilities
 */
export const TestCleanup = {
  /**
   * Clear test data from storage
   */
  clearTestData() {
    const keys = Object.keys(localStorage);
    const testKeys = keys.filter(key => 
      key.startsWith('test_') || key.includes('mock') || key.includes('temp')
    );
    
    testKeys.forEach(key => localStorage.removeItem(key));
    
    console.log(`Cleared ${testKeys.length} test storage keys`);
  },

  /**
   * Reset test state
   */
  resetTestState() {
    // Clear test storage
    this.clearTestData();
    
    // Reset any global test variables
    delete window.testState;
    delete window.mockData;
    
    // Clear console
    if (process.env.NODE_ENV === 'test') {
      console.clear();
    }
    
    console.log('Test state reset');
  },

  /**
   * Generate test report
   */
  generateTestReport(testResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: testResults.length,
        passed: testResults.filter(r => r.passed).length,
        failed: testResults.filter(r => !r.passed).length,
        passRate: Math.round((testResults.filter(r => r.passed).length / testResults.length) * 100),
      },
      failures: testResults.filter(r => !r.passed),
      performance: testResults.filter(r => r.performance),
      environment: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      },
    };
    
    return report;
  },
};

/**
 * Create comprehensive test suite
 */
export function createTestSuite() {
  const runner = new TestRunner();
  
  // Register common tests
  runner.registerTest('Note CRUD Operations', async () => {
    // Mock note service functions
    const mockNotes = new Map();
    
    const createNote = async (note) => {
      const id = MockDataGenerator.generateId();
      mockNotes.set(id, { ...note, id });
      return mockNotes.get(id);
    };
    
    const readNote = async (id) => mockNotes.get(id);
    const updateNote = async (id, updates) => {
      if (mockNotes.has(id)) {
        mockNotes.set(id, { ...mockNotes.get(id), ...updates });
        return mockNotes.get(id);
      }
      return null;
    };
    
    const deleteNote = async (id) => mockNotes.delete(id);
    
    return await TestScenarios.testCRUDOperations(
      createNote, readNote, updateNote, deleteNote
    );
  }, { category: 'notes' });
  
  runner.registerTest('Data Validation', async () => {
    const validateNote = (note) => {
      const isValid = note.title && note.content && note.title.length > 0;
      return { isValid, errors: isValid ? [] : ['Invalid note data'] };
    };
    
    const validNote = MockDataGenerator.generateNote();
    const invalidNote = { title: '', content: null };
    
    return await TestScenarios.testDataValidation(validateNote, validNote, invalidNote);
  }, { category: 'validation' });
  
  runner.registerTest('Performance Test', async () => {
    const operation = async () => {
      // Simulate a heavy operation
      const notes = MockDataGenerator.generateNotes(100);
      return notes.sort((a, b) => a.title.localeCompare(b.title));
    };
    
    return await TestScenarios.testPerformance(operation, 500);
  }, { category: 'performance' });
  
  runner.registerTest('Concurrent Operations', async () => {
    const operation = async (index) => {
      const note = MockDataGenerator.generateNote({ index });
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      return note;
    };
    
    return await TestScenarios.testConcurrentOperations(operation, 10);
  }, { category: 'concurrency' });
  
  return runner;
}

/**
 * Quick test runner for development
 */
export async function runQuickTests() {
  console.log('🧪 Running quick tests...');
  
  const cleanup = TestState.createTestEnvironment();
  
  try {
    const testSuite = createTestSuite();
    const results = await testSuite.runAllTests();
    
    if (results.passed === results.total) {
      console.log('🎉 All tests passed!');
    } else {
      console.warn(`⚠️ ${results.failed} tests failed`);
    }
    
    return results;
  } finally {
    cleanup.cleanup();
  }
}

// Export commonly used functions
export default {
  MockDataGenerator,
  TestState,
  TestRunner,
  TestScenarios,
  TestCleanup,
  createTestSuite,
  runQuickTests,
};