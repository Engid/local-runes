#!/usr/bin/env node

/**
 * A simple script to remove test files from the dist directory
 */

import { readdir, rm } from 'fs/promises';
import { join } from 'path';

const DIST_DIR = 'dist';

async function cleanPackage() {
  try {
    console.log('Cleaning test files from package...');
    const files = await readdir(DIST_DIR);
    
    const testFiles = files.filter(file => 
      file.includes('.test.') || 
      file.includes('.spec.')
    );
    
    if (testFiles.length === 0) {
      console.log('No test files found.');
      return;
    }
    
    console.log(`Found ${testFiles.length} test files to remove:`);
    
    for (const file of testFiles) {
      const path = join(DIST_DIR, file);
      console.log(`- Removing ${path}`);
      await rm(path);
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error cleaning package:', error);
    process.exit(1);
  }
}

cleanPackage(); 