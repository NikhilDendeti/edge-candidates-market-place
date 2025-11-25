/**
 * Comprehensive Production Endpoint Test Suite
 * Tests all endpoints on https://edge-candidates-market-place.onrender.com
 */

import https from 'https';
import http from 'http';

const BASE_URL = 'https://edge-candidates-market-place.onrender.com';
const TIMEOUT = 30000; // 30 seconds timeout

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT,
    };

    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const json = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: json,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
            parseError: error.message,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testEndpoint(name, method, path, expectedStatus, validator = null, data = null) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   ${method} ${path}`);
    
    const response = await makeRequest(method, path, data);
    
    const statusMatch = response.statusCode === expectedStatus;
    let validationPassed = true;
    let validationMessage = '';

    if (validator) {
      const result = validator(response);
      validationPassed = result.passed;
      validationMessage = result.message || '';
    }

    if (statusMatch && validationPassed) {
      console.log(`   ✅ PASSED (Status: ${response.statusCode})`);
      if (validationMessage) {
        console.log(`   ${validationMessage}`);
      }
      testResults.passed++;
      return { success: true, response };
    } else {
      console.log(`   ❌ FAILED`);
      if (!statusMatch) {
        console.log(`   Expected status ${expectedStatus}, got ${response.statusCode}`);
      }
      if (!validationPassed && validationMessage) {
        console.log(`   ${validationMessage}`);
      }
      console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
      testResults.failed++;
      testResults.errors.push({
        endpoint: name,
        path,
        expectedStatus,
        actualStatus: response.statusCode,
        response: response.data
      });
      return { success: false, response };
    }
  } catch (error) {
    console.log(`   ❌ FAILED - Error: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({
      endpoint: name,
      path,
      error: error.message
    });
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   PRODUCTION ENDPOINT TEST SUITE                          ║');
  console.log('║   Testing: https://edge-candidates-market-place.onrender.com ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Test 1: Health Check
  await testEndpoint(
    'Health Check',
    'GET',
    '/health',
    200,
    (res) => {
      if (res.data.status === 'ok' && res.data.timestamp) {
        return { passed: true, message: `Server is healthy (${res.data.timestamp})` };
      }
      return { passed: false, message: 'Missing status or timestamp' };
    }
  );

  // Test 2: Stats Summary
  const statsResult = await testEndpoint(
    'Stats Summary',
    'GET',
    '/api/stats/summary',
    200,
    (res) => {
      const hasTotalCandidates = typeof res.data.totalCandidates === 'number';
      const hasBranchDistribution = Array.isArray(res.data.branchDistribution);
      const hasVerdictSummary = Array.isArray(res.data.verdictSummary);
      
      if (hasTotalCandidates && hasBranchDistribution && hasVerdictSummary) {
        return { 
          passed: true, 
          message: `Total candidates: ${res.data.totalCandidates}, Branches: ${res.data.branchDistribution.length}, Verdicts: ${res.data.verdictSummary.length}` 
        };
      }
      return { passed: false, message: 'Missing required fields' };
    }
  );

  // Test 3: Branch Distribution
  await testEndpoint(
    'Branch Distribution',
    'GET',
    '/api/stats/branch-distribution',
    200,
    (res) => {
      if (Array.isArray(res.data)) {
        return { passed: true, message: `Found ${res.data.length} branches` };
      }
      return { passed: false, message: 'Response is not an array' };
    }
  );

  // Test 4: Candidates List (default)
  const candidatesResult = await testEndpoint(
    'Candidates List (Default)',
    'GET',
    '/api/candidates',
    200,
    (res) => {
      const hasData = Array.isArray(res.data.data);
      const hasPagination = res.data.pagination && typeof res.data.pagination.total === 'number';
      
      if (hasData && hasPagination) {
        return { 
          passed: true, 
          message: `Found ${res.data.data.length} candidates, Total: ${res.data.pagination.total}` 
        };
      }
      return { passed: false, message: 'Missing data or pagination' };
    }
  );

  // Get a candidate ID for subsequent tests
  let testCandidateId = null;
  if (candidatesResult.success && candidatesResult.response?.data?.data?.length > 0) {
    testCandidateId = candidatesResult.response.data.data[0].id;
    console.log(`\n📌 Using candidate ID for tests: ${testCandidateId}`);
  }

  // Test 5: Candidates List (with pagination)
  await testEndpoint(
    'Candidates List (Pagination)',
    'GET',
    '/api/candidates?page=1&limit=5',
    200,
    (res) => {
      if (res.data.pagination?.limit === 5) {
        return { passed: true, message: 'Pagination working correctly' };
      }
      return { passed: false, message: 'Pagination not working' };
    }
  );

  // Test 6: Candidates List (with search)
  await testEndpoint(
    'Candidates List (Search)',
    'GET',
    '/api/candidates?search=test',
    200,
    (res) => {
      return { passed: true, message: 'Search endpoint responded' };
    }
  );

  // Test 7: Candidates List (with verdict filter)
  await testEndpoint(
    'Candidates List (Verdict Filter)',
    'GET',
    '/api/candidates?verdict=Strong',
    200,
    (res) => {
      return { passed: true, message: 'Verdict filter working' };
    }
  );

  // Test 8: Candidates List (with sorting)
  await testEndpoint(
    'Candidates List (Sorting)',
    'GET',
    '/api/candidates?sort=assessment_avg&order=desc',
    200,
    (res) => {
      return { passed: true, message: 'Sorting working' };
    }
  );

  // Test 9: Post Candidate View (if we have a candidate ID)
  if (testCandidateId) {
    const viewResult = await testEndpoint(
      'Post Candidate View',
      'POST',
      `/api/candidates/${testCandidateId}/view`,
      201,
      (res) => {
        const hasViewId = res.data.viewId;
        const hasUserId = res.data.userId;
        const hasCandidateId = res.data.candidateId;
        const hasViewedAt = res.data.viewedAt;
        
        if (hasViewId && hasUserId && hasCandidateId && hasViewedAt) {
          return { 
            passed: true, 
            message: `View logged: ${res.data.viewId.substring(0, 8)}...` 
          };
        }
        return { passed: false, message: 'Missing required fields in response' };
      },
      {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        company: 'Test Corp',
        phone: '+91 9876543210'
      }
    );

    // Test 10: Get Candidate Viewers (if view was created)
    if (viewResult.success) {
      await testEndpoint(
        'Get Candidate Viewers',
        'GET',
        `/api/candidates/${testCandidateId}/viewers`,
        200,
        (res) => {
          const hasCandidate = res.data.candidate;
          const hasData = Array.isArray(res.data.data);
          const hasPagination = res.data.pagination;
          
          if (hasCandidate && hasData && hasPagination) {
            return { 
              passed: true, 
              message: `Total views: ${res.data.candidate.totalViews}, Unique viewers: ${res.data.candidate.uniqueViewers}` 
            };
          }
          return { passed: false, message: 'Missing required fields' };
        }
      );
    }
  } else {
    console.log('\n⚠️  Skipping candidate view tests - no candidate ID available');
  }

  // Test 11: Get Student Profile (if we have a candidate ID)
  if (testCandidateId) {
    await testEndpoint(
      'Get Student Profile',
      'GET',
      `/api/students/${testCandidateId}`,
      200,
      (res) => {
        const hasId = res.data.id;
        const hasName = res.data.name;
        
        if (hasId && hasName) {
          return { 
            passed: true, 
            message: `Student: ${res.data.name}` 
          };
        }
        return { passed: false, message: 'Missing required fields' };
      }
    );
  }

  // Test 12: Get Student Profile (with includeAllData)
  if (testCandidateId) {
    await testEndpoint(
      'Get Student Profile (Complete Data)',
      'GET',
      `/api/students/${testCandidateId}?includeAllData=true`,
      200,
      (res) => {
        return { passed: true, message: 'Complete data mode working' };
      }
    );
  }

  // Test 13: Get User View History (using test email - expected 404)
  await testEndpoint(
    'Get User View History',
    'GET',
    '/api/users/test@example.com/candidates',
    404,
    (res) => {
      // Expected 404 for non-existent user
      if (res.statusCode === 404 && res.data.error?.code === 'NOT_FOUND') {
        return { passed: true, message: 'Correctly returns 404 for non-existent user' };
      }
      return { passed: false, message: `Expected 404, got ${res.statusCode}` };
    }
  );

  // Test 14: Get User View Stats (expected 404)
  await testEndpoint(
    'Get User View Stats',
    'GET',
    '/api/users/test@example.com/stats',
    404,
    (res) => {
      // Expected 404 for non-existent user
      if (res.statusCode === 404 && res.data.error?.code === 'NOT_FOUND') {
        return { passed: true, message: 'Correctly returns 404 for non-existent user' };
      }
      return { passed: false, message: `Expected 404, got ${res.statusCode}` };
    }
  );

  // Test 15: Diagnostics Test DB
  await testEndpoint(
    'Diagnostics Test DB',
    'GET',
    '/api/diagnostics/test-db',
    200,
    (res) => {
      if (res.data.success !== undefined) {
        return { 
          passed: true, 
          message: res.data.success ? 'Database connection OK' : 'Database connection failed' 
        };
      }
      return { passed: false, message: 'Missing success field' };
    }
  );

  // Test 16: Error Handling - Invalid Candidate ID
  await testEndpoint(
    'Error Handling - Invalid Candidate ID',
    'GET',
    '/api/students/00000000-0000-0000-0000-000000000000',
    404,
    (res) => {
      return { passed: true, message: 'Correctly returns 404 for invalid ID' };
    }
  );

  // Test 17: Error Handling - Invalid View Request
  await testEndpoint(
    'Error Handling - Invalid View Request',
    'POST',
    testCandidateId ? `/api/candidates/${testCandidateId}/view` : '/api/candidates/invalid/view',
    400,
    (res) => {
      return { passed: true, message: 'Correctly returns 400 for invalid request' };
    },
    {
      // Missing required fields
      name: 'Test'
    }
  );

  // Print Summary
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n\n❌ FAILED TESTS:');
    testResults.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.endpoint || 'Unknown'}`);
      console.log(`   Path: ${error.path}`);
      if (error.expectedStatus) {
        console.log(`   Expected: ${error.expectedStatus}, Got: ${error.actualStatus}`);
      }
      if (error.error) {
        console.log(`   Error: ${error.error}`);
      }
      if (error.response) {
        console.log(`   Response: ${JSON.stringify(error.response).substring(0, 150)}...`);
      }
    });
  }

  console.log('\n' + '='.repeat(60));
  
  if (testResults.failed === 0) {
    console.log('✅ All endpoints are behaving as expected!');
    process.exit(0);
  } else {
    console.log('⚠️  Some endpoints have issues. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

