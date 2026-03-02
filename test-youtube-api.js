#!/usr/bin/env node

// Simple test to check YouTube API key
const key = process.env.YOUTUBE_API_KEY;

if (!key) {
  console.error('❌ YOUTUBE_API_KEY is NOT set');
  console.log('📝 Please add this line to your .env.local:');
  console.log('YOUTUBE_API_KEY=AIzaSyBQLTasL5s6YaKAo1YJU-04BNByvnO3IkA');
  process.exit(1);
}

console.log('✅ YOUTUBE_API_KEY is set');
console.log(`Key starts with: ${key.substring(0, 10)}...`);

// Test API call
console.log('\n🔍 Testing YouTube API...');

fetch('https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=test&maxResults=1&key=' + key)
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      console.error('❌ API Error:', data.error.message);
    } else {
      console.log('✅ API works! Found', data.items?.length || 0, 'videos');
    }
  })
  .catch(err => {
    console.error('❌ Fetch error:', err.message);
  });
