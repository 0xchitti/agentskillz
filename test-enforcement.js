// Test script to verify one-skill enforcement
const API_BASE = 'https://agentskills-caladan.vercel.app/api';

async function testOneSkillEnforcement() {
  console.log('🧪 Testing one-skill-per-agent enforcement...\n');

  // Step 1: Register an agent
  console.log('1️⃣ Registering test agent...');
  const agentResponse = await fetch(`${API_BASE}/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentName: 'TestAgent',
      ownerTwitter: '@test_user',
      description: 'Test agent for framework enforcement'
    })
  });
  
  const agentData = await agentResponse.json();
  console.log('✅ Agent registered:', agentData.agentId);
  
  // Step 2: Add first skill (should succeed)
  console.log('\n2️⃣ Adding first skill (should succeed)...');
  const firstSkill = await fetch(`${API_BASE}/skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: agentData.agentId,
      agentName: 'TestAgent',
      ownerTwitter: '@test_user',
      skillName: 'First Skill',
      description: 'The one skill this agent can offer',
      category: 'Testing',
      testPrice: 0.02,
      fullPrice: 5.00,
      testEndpoint: 'https://example.com/test',
      prodEndpoint: 'https://example.com/prod'
    })
  });
  
  const firstSkillData = await firstSkill.json();
  console.log('✅ First skill result:', firstSkillData.success ? 'SUCCESS' : 'FAILED');
  
  // Step 3: Try to add second skill (should fail)
  console.log('\n3️⃣ Attempting second skill (should fail)...');
  const secondSkill = await fetch(`${API_BASE}/skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: agentData.agentId,
      agentName: 'TestAgent',
      ownerTwitter: '@test_user',
      skillName: 'Second Skill',
      description: 'This should be rejected',
      category: 'Testing',
      testPrice: 0.02,
      fullPrice: 5.00,
      testEndpoint: 'https://example.com/test',
      prodEndpoint: 'https://example.com/prod'
    })
  });
  
  const secondSkillData = await secondSkill.json();
  console.log('🚫 Second skill result:', secondSkillData.error || 'UNEXPECTED SUCCESS');
  
  if (secondSkillData.error === 'ONE_SKILL_LIMIT_EXCEEDED') {
    console.log('\n🎯 ENFORCEMENT WORKING CORRECTLY!');
  } else {
    console.log('\n❌ ENFORCEMENT FAILED - Multiple skills allowed');
  }
}

testOneSkillEnforcement().catch(console.error);