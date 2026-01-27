#!/usr/bin/env node

/**
 * Migration Progress Update Script
 * 
 * Usage: node scripts/update-progress.js --phase=1 --status="in-progress"
 *        node scripts/update-progress.js --phase=2 --status="completed"
 *        node scripts/update-progress.js --list
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_PLAN_PATH = path.join(__dirname, '../MIGRATION_PLAN.md');

// Phase definitions for quick reference
const PHASES = {
  1: 'Phase 1: Core Algorithm Fixes',
  2: 'Phase 2: Contrast System', 
  3: 'Phase 3: Named Color Detection',
  4: 'Phase 4: Hue Nudgers UI',
  5: 'Phase 5: Enhanced Swatch Display',
  6: 'Phase 6: Additional Features',
  7: 'Phase 7: Testing & Validation'
};

const STATUS_ICONS = {
  'not-started': '❌',
  'in-progress': '🟡', 
  'completed': '✅',
  'blocked': '🔴',
  'review': '🔍'
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      options[key] = value || true;
    }
  });
  
  return options;
}

function updatePhaseStatus(phase, status) {
  if (!PHASES[phase]) {
    console.error(`Invalid phase: ${phase}. Valid phases: 1-7`);
    process.exit(1);
  }
  
  if (!STATUS_ICONS[status]) {
    console.error(`Invalid status: ${status}. Valid statuses: ${Object.keys(STATUS_ICONS).join(', ')}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(MIGRATION_PLAN_PATH, 'utf8');
  const phaseHeader = PHASES[phase];
  const icon = STATUS_ICONS[status];
  
  // Find the phase header line and update its status
  const lines = content.split('\n');
  let updated = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(phaseHeader)) {
      // Look for the first sub-section (###) and update its status
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].includes('###') && lines[j + 1] && lines[j + 1].includes('Status:')) {
          lines[j + 1] = `**Status**: ${icon} **${status.toUpperCase().replace('-', ' ')}**`;
          updated = true;
          break;
        }
      }
      break;
    }
  }
  
  if (!updated) {
    console.error(`Could not find phase header for ${phaseHeader}`);
    process.exit(1);
  }
  
  // Update the last updated date
  const today = new Date().toISOString().split('T')[0];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('**Last Updated**:')) {
      lines[i] = `**Last Updated**: ${today}`;
      break;
    }
  }
  
  fs.writeFileSync(MIGRATION_PLAN_PATH, lines.join('\n'));
  console.log(`✅ Updated ${phaseHeader} status to: ${status}`);
}

function updateTaskStatus(phase, taskNumber, status) {
  const content = fs.readFileSync(MIGRATION_PLAN_PATH, 'utf8');
  const lines = content.split('\n');
  
  // Find the phase and then the specific task
  let inPhase = false;
  let taskCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`## ${PHASES[phase]}`)) {
      inPhase = true;
      taskCount = 0;
      continue;
    }
    
    if (inPhase && lines[i].startsWith('## ')) {
      // We've moved to the next phase
      break;
    }
    
    if (inPhase && lines[i].trim().startsWith('- [ ]')) {
      taskCount++;
      if (taskCount === taskNumber) {
        const icon = STATUS_ICONS[status] || '❌';
        lines[i] = lines[i].replace('- [ ]', `- [${icon}]`);
        fs.writeFileSync(MIGRATION_PLAN_PATH, lines.join('\n'));
        console.log(`✅ Updated task ${taskNumber} in ${PHASES[phase]} to: ${status}`);
        return;
      }
    }
  }
  
  console.error(`Could not find task ${taskNumber} in ${PHASES[phase]}`);
  process.exit(1);
}

function listProgress() {
  const content = fs.readFileSync(MIGRATION_PLAN_PATH, 'utf8');
  const lines = content.split('\n');
  
  console.log('\n📊 Migration Progress Overview:\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## 🚨') || lines[i].startsWith('## 🎨') || 
        lines[i].startsWith('## 🏷️') || lines[i].startsWith('## 🎛️') || 
        lines[i].startsWith('## 🎯') || lines[i].startsWith('## ✨') || 
        lines[i].startsWith('## 🧪')) {
      
      console.log(lines[i]);
      
      // Show status line
      if (lines[i + 1] && lines[i + 1].includes('Status:')) {
        console.log(lines[i + 1]);
      }
      
      // Count completed tasks
      let taskCount = 0;
      let completedCount = 0;
      let j = i + 2;
      
      while (j < lines.length && !lines[j].startsWith('## ')) {
        if (lines[j].trim().startsWith('- [')) {
          taskCount++;
          if (lines[j].includes('[✅]')) {
            completedCount++;
          }
        }
        j++;
      }
      
      if (taskCount > 0) {
        const percentage = Math.round((completedCount / taskCount) * 100);
        console.log(`   Progress: ${completedCount}/${taskCount} tasks (${percentage}%)\n`);
      }
    }
  }
}

function main() {
  const args = parseArgs();
  
  if (args.list) {
    listProgress();
  } else if (args.phase && args.status) {
    if (args.task) {
      updateTaskStatus(args.phase, parseInt(args.task), args.status);
    } else {
      updatePhaseStatus(args.phase, args.status);
    }
  } else {
    console.log('Usage:');
    console.log('  node scripts/update-progress.js --list');
    console.log('  node scripts/update-progress.js --phase=1 --status="in-progress"');
    console.log('  node scripts/update-progress.js --phase=2 --task=3 --status="completed"');
    console.log('');
    console.log('Statuses:', Object.keys(STATUS_ICONS).join(', '));
    console.log('Phases: 1-7');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { updatePhaseStatus, updateTaskStatus, listProgress };
