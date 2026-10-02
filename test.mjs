import fs from 'fs';

const API_BASE = 'http://localhost:3000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  const results = [];
  function assert(name, condition, errorMsg = 'Failed') {
    if (condition) {
      results.push({ test: name, result: 'PASS' });
      console.log(`✅ PASS: ${name}`);
    } else {
      results.push({ test: name, result: 'FAIL', error: errorMsg });
      console.log(`❌ FAIL: ${name} - ${errorMsg}`);
    }
  }

  try {
    // 19. Reset/seed data
    console.log('Seeding data...');
    let res = await request('/tasks/seed', { method: 'POST' });
    assert('Reset/seed data', res.status === 200 && res.data.ok === true);

    // 1. GET tasks & 2. Pagination & 3. Page size
    res = await request('/tasks?page=1&perPage=5');
    assert('GET tasks (page 1, perPage 5)', res.status === 200 && res.data.data.length <= 5 && res.data.total > 0);
    const firstTaskId = res.data.data[0].id;

    // 4. Sorting & 5. Multi-column sorting
    res = await request('/tasks?sort=' + encodeURIComponent(JSON.stringify([{ id: 'title', desc: true }])));
    assert('Sorting (title desc)', res.status === 200 && res.data.data.length > 0);

    // 6. Search
    res = await request('/tasks?title=test');
    assert('Search (title)', res.status === 200);

    // 7. Status filtering & 8. Priority filtering & 9. Label filtering
    res = await request('/tasks?status=todo,in-progress&priority=high&label=bug');
    assert('Faceted filtering (status, priority, label)', res.status === 200);

    // 10. Date filtering
    res = await request('/tasks?from=2024-01-01&to=2025-01-01');
    assert('Date filtering', res.status === 200);

    // 11. Advanced AND filters & 12. Advanced OR filters
    const filters = [{ field: 'status', operator: 'eq', value: 'todo' }];
    res = await request('/tasks?joinOperator=and&filters=' + encodeURIComponent(JSON.stringify(filters)));
    assert('Advanced filters', res.status === 200);

    // 13. Facet counts
    res = await request('/tasks/facets');
    assert('Facet counts', res.status === 200 && res.data.status);

    // 14. Create task
    res = await request('/tasks', { method: 'POST', body: JSON.stringify({ title: 'New Auto Task', status: 'todo' }) });
    assert('Create task', res.status === 201 && res.data.data.id);
    const newTaskId = res.data.data.id;

    // 15. Update task
    res = await request(`/tasks/${newTaskId}`, { method: 'PATCH', body: JSON.stringify({ status: 'done' }) });
    assert('Update task', res.status === 200 && res.data.data.status === 'done');

    // 16. Delete task
    res = await request(`/tasks/${newTaskId}`, { method: 'DELETE' });
    assert('Delete task', res.status === 200);

    // 17. Bulk delete & 18. Bulk status update
    // First create a couple
    const t1 = await request('/tasks', { method: 'POST', body: JSON.stringify({ title: 'T1' }) });
    const t2 = await request('/tasks', { method: 'POST', body: JSON.stringify({ title: 'T2' }) });
    const ids = [t1.data.data.id, t2.data.data.id];

    res = await request('/tasks/bulk-update', { method: 'POST', body: JSON.stringify({ ids, status: 'canceled' }) });
    assert('Bulk status update', res.status === 200 && res.data.count === 2);

    res = await request('/tasks/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) });
    assert('Bulk delete', res.status === 200 && res.data.count === 2);

    // 20. Invalid input validation
    res = await request('/tasks', { method: 'POST', body: JSON.stringify({}) }); // missing title
    assert('Invalid input validation (400)', res.status === 400);

    // 21. Invalid task ID handling
    res = await request('/tasks/nonexistent-123', { method: 'GET' });
    assert('Invalid task ID handling (404)', res.status === 404);

    console.log('\n--- Test Summary ---');
    results.forEach(r => {
      console.log(`${r.result}: ${r.test}`);
    });

  } catch (err) {
    console.error('Test error:', err);
  }
}

runTests();
