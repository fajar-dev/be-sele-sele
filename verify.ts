const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('--- Starting Verification ---');

  // 1. Create Page
  console.log('\n1. Creating Page...');
  const createRes = await fetch(`${BASE_URL}/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Test Page',
      description: 'This is a test page',
      icon: 'home'
    })
  });
  const createData = await createRes.json();
  console.log('Create Response:', createData);
  if (!createRes.ok) throw new Error('Failed to create page');
  const pageId = createData.data.id;

  // 2. Get All Pages
  console.log('\n2. Getting All Pages...');
  const listRes = await fetch(`${BASE_URL}/pages`);
  const listData = await listRes.json();
  console.log('List Response:', listData);
  
  // 3. Get Single Page
  console.log('\n3. Getting Single Page...');
  const getRes = await fetch(`${BASE_URL}/pages/${pageId}`);
  const getData = await getRes.json();
  console.log('Get Response:', getData);

  // 4. Update Page
  console.log('\n4. Updating Page...');
  const updateRes = await fetch(`${BASE_URL}/pages/${pageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Updated Test Page'
    })
  });
  const updateData = await updateRes.json();
  console.log('Update Response:', updateData);

  // 5. Delete Page
  console.log('\n5. Deleting Page...');
  const deleteRes = await fetch(`${BASE_URL}/pages/${pageId}`, {
    method: 'DELETE'
  });
  const deleteData = await deleteRes.json();
  console.log('Delete Response:', deleteData);

  // 6. Verify Delete (Get should be 404)
  console.log('\n6. Verifying Delete...');
  const verifyRes = await fetch(`${BASE_URL}/pages/${pageId}`);
  if (verifyRes.status === 404) {
    console.log('SUCCESS: Page not found as expected.');
  } else {
    console.log('FAILURE: Page still exists or other error.', verifyRes.status);
  }
}

run().catch(console.error);
