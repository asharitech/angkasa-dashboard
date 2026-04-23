const fs = require('fs');
const content = fs.readFileSync('/home/andi/Workspaces/playgrounds/asharitech-angkasa/tmp/mockup/angkasa/agenda.html', 'utf8');
const match = content.match(/<style>([\s\S]*?)<\/style>/);
if (match) {
  const globalsPath = '/home/andi/Workspaces/playgrounds/asharitech-angkasa/playgrounds/angkasa-dashboard/src/app/globals.css';
  fs.appendFileSync(globalsPath, `\n/* agenda.html */\n` + match[1]);
  console.log('Agenda CSS appended.');
} else {
  console.log('No style block found in agenda.html');
}
