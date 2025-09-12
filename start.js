const { spawn } = require('child_process');
const path = require('path');

console.log('🚚 Starting TMS Transportation Management System...');
console.log('================================================');

// Start the backend server
const server = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'pipe'
});

server.stdout.on('data', (data) => {
  console.log(`[SERVER] ${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
  console.error(`[SERVER ERROR] ${data.toString().trim()}`);
});

// Start the React development server
setTimeout(() => {
  console.log('\n🚀 Starting React development server...');
  
  const client = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'client'),
    stdio: 'pipe',
    shell: true
  });
  
  client.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output.includes('Local:') || output.includes('webpack compiled')) {
      console.log(`[CLIENT] ${output}`);
    }
  });
  
  client.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (!output.includes('webpack-dev-server') && !output.includes('Browserslist')) {
      console.log(`[CLIENT] ${output}`);
    }
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down TMS system...');
    server.kill();
    client.kill();
    process.exit();
  });
  
}, 3000);

console.log('\n📋 Demo Credentials:');
console.log('   Admin: admin@tms.com / demo123');
console.log('   Driver: john.driver@tms.com / demo123');
console.log('\n🌐 Access URLs:');
console.log('   Frontend: http://localhost:3000');
console.log('   Backend API: http://localhost:5000');
console.log('\n⚡ Features:');
console.log('   • Real-time GPS tracking');
console.log('   • Trip management');
console.log('   • Driver management');
console.log('   • Invoice generation');
console.log('   • Live analytics dashboard');
console.log('\n🔄 Press Ctrl+C to stop the system');
console.log('================================================\n');