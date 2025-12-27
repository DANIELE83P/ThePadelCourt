import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CONTEXT_PATH = path.join(process.cwd(), 'PROJECT_CONTEXT.md');
const DATE = new Date().toISOString().split('T')[0];

function updateTimestamp() {
    if (!fs.existsSync(CONTEXT_PATH)) return;

    let content = fs.readFileSync(CONTEXT_PATH, 'utf8');
    const regex = /\*Ultimo Aggiornamento: .*\*/;
    const newTimestamp = `*Ultimo Aggiornamento: ${DATE}*`;

    if (regex.test(content)) {
        content = content.replace(regex, newTimestamp);
    } else {
        content += `\n\n---\n${newTimestamp}`;
    }

    fs.writeFileSync(CONTEXT_PATH, content);
    console.log(`✅ PROJECT_CONTEXT.md aggiornato al ${DATE}`);
}

updateTimestamp();
