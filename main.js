#! /usr/bin/env node

const lockfile = require('yarn-lockfile');
const execSync = require('child_process').execSync;
const fs = require('fs');

function npmName(spec) {
  return spec.split('@')[0];
}

function formatedHash(obj) {
  const dst = {};
  Object.keys(obj).forEach(function(key) {
    name = npmName(key);
    dst[name] = { name: npmName(key), version: obj[key].version };
  });
  return dst;
};

function readGitYarn(version) {
  let string = execSync(`git show ${version}:yarn.lock`).toString();
  let json = lockfile.parse(string);
  return json;
}

function parse(file) {
  let string = fs.readFileSync(file, 'utf8');
  let json = lockfile.parse(string);
  return json;
}

function diffs(previous, current) {
  const previousArray = formatedHash(previous);
  const currentArray = formatedHash(current);

  let exists = false;
  const addedHash = {};
  const updatedHash = {};

  Object.keys(currentArray).forEach(function(curr, i) {
    exists = false;

    Object.keys(previousArray).forEach(function(prev, j) {

      if (currentArray[curr].name === previousArray[prev].name) {
        exists = true;
        if (currentArray[curr].version !== previousArray[prev].version) {
          updatedHash[curr] = {
            previous: previousArray[prev].version,
            current: currentArray[curr].version,
          };
        }
        return;
      }
    });

    if (!exists) {
      addedHash[curr] = {
        previous: '',
        current: currentArray[curr].version,
      }
    }
  });


  return Object.assign(updatedHash, addedHash);
}

if (process.argv.length < 4) {
  console.log('Usage: yarn-diff previous current');
  console.log('previous current is git commit number');
  process.exit();
}

const previousVersion = process.argv[2];
const currentVersion = process.argv[3];
const previousJson = readGitYarn(previousVersion);
const currentJson = readGitYarn(currentVersion);

console.log(JSON.stringify(diffs(previousJson, currentJson)));
