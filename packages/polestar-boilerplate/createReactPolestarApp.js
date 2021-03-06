'use strict';

const validateProjectName = require('validate-npm-package-name');
const chalk = require('chalk');
const commander = require('commander');
// const fs = require('fs');
const fs = require('fs-extra');
const path = require('path');
const execSync = require('child_process').execSync;
const spawn = require('cross-spawn');
const semver = require('semver');

const packageJson = require('./package.json');

let projectName;
const templateModule = 'polestar-template';
// const templatePackageJson = require('../../package.json');

const program = new commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action(name => {
    projectName = name;
  })
  .allowUnknownOption()
  .on('--help', () => {
    console.log(`    Only ${chalk.green('<project-directory>')} is required.`);
    console.log();
    console.log(
      `    If you have any problems, do not hesitate to file an issue:`
    );
    console.log(
      `      ${chalk.cyan('https://github.com/nkiateam/polestar-boilerplate/issues/new')}`
    );
    console.log();
  })
  .parse(process.argv);

if (typeof projectName === 'undefined') {
  console.error('Please specify the project directory:');
  console.log(
    `  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`
  );
  console.log();
  console.log('For example:');
  console.log(`  ${chalk.cyan(program.name())} ${chalk.green('my-react-app')}`);
  console.log();
  console.log(
    `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
  );
  process.exit(1);
}
// console.log('projectName: %s', projectName);

// C:\Users\user\AppData\Roaming\npm\node_modules\create-react-app 디렉토리에 createReactApp.js 참고하면서 개발하자
// node .\create-react-app.js 프로젝트명
// node .\index.js 프로젝트명
createApp(projectName);

function createApp(name) {
  const root = path.resolve(name);
  const appName = path.basename(root);
  // console.log(root, appName);
  
  checkAppName(appName);
  fs.ensureDirSync(name);
  if (!isSafeToCreateProjectIn(root)) {
    console.log(
      `The directory ${chalk.green(name)} contains files that could conflict.`
    );
    console.log('Try using a new directory name.');
    process.exit(1);
  }

  console.log(`Creating a new React app in ${chalk.green(root)}.`);
  console.log();

  // package.json 생성
  const packageJson = {
    name: appName,
    version: '0.1.0',
    description: '',
    scripts: {
        examples: 'webpack-dev-server --config node_modules/polestar-template/examples/webpack.config.js --open',
        template: 'cross-env NODE_ENV=production TEMP_TYPE=template webpack-dev-server --config ./webpack.dev.config.js --open',
        'build:clean': 'rimraf ./build',
        build: 'npm run build:clean && cross-env NODE_ENV=production webpack --config ./webpack.prod.config.js',
        start: 'webpack-dev-server --config ./webpack.dev.config.js --open'
    },
    author: 'NKIA',
  };
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  const originalDirectory = process.cwd();
  process.chdir(root);

  // yarn 체크
  const useYarn = shouldUseYarn();
  if (!useYarn) {
    const npmInfo = checkNpmVersion();
    // console.log('npmInfo.hasMinNpm', npmInfo.hasMinNpm);
    // console.log('npmInfo.npmVersion', npmInfo.npmVersion);
    if (!npmInfo.hasMinNpm) {
      if (npmInfo.npmVersion) {
        console.log(
          chalk.yellow(
            `You are using npm ${npmInfo.npmVersion} so the project will be boostrapped with an old unsupported version of tools.\n\n` +
              `Please update to npm 3 or higher for a better, fully supported experience.\n`
          )
        );
      }
    }
  }

  run(root, appName, originalDirectory, useYarn);
  // var child = spawn('npm', ['install', '--save', '--save-exact', 'fs-extra', 'hyperquest'], { stdio: 'inherit' });
}

// appName 체크
function checkAppName(appName) {
  // if(fs.existsSync('./' + appName)) {
  //   console.log(`The directory ${chalk.green(appName)} contains files that could conflict.`);
  //   console.log('Try using a new directory name.');
  //   process.exit(1);
  // }
  const validationResult = validateProjectName(appName);
  if (!validationResult.validForNewPackages) {
    console.error(
      `Could not create a project called ${chalk.red(
        `"${appName}"`
      )} because of npm naming restrictions:`
    );
    printValidationResults(validationResult.errors);
    printValidationResults(validationResult.warnings);
    process.exit(1);
  }

  // TODO: there should be a single place that holds the dependencies
  const dependencies = ['react', 'react-dom'];
  const devDependencies = [templateModule];//['react-scripts'];
  const allDependencies = dependencies.concat(devDependencies).sort();
  if (allDependencies.indexOf(appName) >= 0) {
    console.error(
      chalk.red(
        `We cannot create a project called ${chalk.green(appName)} because a dependency with the same name exists.\n` +
          `Due to the way npm works, the following names are not allowed:\n\n`
      ) +
        chalk.cyan(allDependencies.map(depName => `  ${depName}`).join('\n')) +
        chalk.red('\n\nPlease choose a different project name.')
    );
    process.exit(1);
  }
}

function printValidationResults(results) {
    if (typeof results !== 'undefined') {
        results.forEach(error => {
            console.error(chalk.red(`  *  ${error}`));
        });
    }
}

// If project only contains files generated by GH, it’s safe.
// We also special case IJ-based products .idea because it integrates with CRA:
function isSafeToCreateProjectIn(root) {
  const validFiles = [
    '.DS_Store',
    'Thumbs.db',
    '.git',
    '.gitignore',
    '.idea',
    'README.md',
    'LICENSE',
    'web.iml',
    '.hg',
    '.hgignore',
    '.hgcheck',
  ];
  console.log();
  return fs.readdirSync(root).every(file => validFiles.indexOf(file) >= 0);
}

// yarn 사용여부
function shouldUseYarn() {
  try {
    execSync('yarnpkg --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

// npm 버전 체크
function checkNpmVersion() {
  let hasMinNpm = false;
  let npmVersion = null;
  try {
    npmVersion = execSync('npm --version').toString().trim();
    hasMinNpm = semver.gte(npmVersion, '3.0.0');
  } catch (err) {
    // ignore
  }
  return {
    hasMinNpm: hasMinNpm,
    npmVersion: npmVersion,
  };
}

function run(appPath, appName, originalDirectory, useYarn) {
  // const allDependencies = Object.keys(templatePackageJson.dependencies);
  // const allDevDependencies = Object.keys(templatePackageJson.devDependencies);
  // allDevDependencies.push(templateModule);
  
  const allDependencies = ['react', 'react-dom', 'prop-types', 'react-router', 'react-router-dom',
                            'redux', 'react-redux', 'redux-thunk', 'reselect', 'redux-logger',
                            'babel-polyfill',
                            'polestar-ui-kit', 'polestar-utils', 'polestar-icons',
							              'store', 'jwt-decode'];
  const allDevDependencies = [templateModule, 
                              'babel-core', 'babel-eslint', 'babel-loader',
                              'babel-preset-env', 'babel-preset-minify', 'babel-preset-react',              
							                'babel-plugin-transform-object-rest-spread', 'babel-plugin-transform-decorators-legacy',
							                'babel-plugin-transform-class-properties', 'babel-plugin-transform-async-to-generator',
                              'rimraf', 'cross-env',
                              'webpack@3.12.0', 'webpack-dev-server@2.11.2',
                              'html-loader', 'json-loader', 'url-loader', 'file-loader',
                              'style-loader', 'css-loader', 'postcss-flexbugs-fixes', 'postcss-loader', 'autoprefixer',
                              'less@2.7.3', 'less-loader',
                              'html-webpack-plugin', 'extract-text-webpack-plugin',
                              'eslint', 'eslint-plugin-react', 'eslint-plugin-import', 'eslint-plugin-jsx-a11y', 
                              'eslint-loader', 'eslint-config-airbnb'];
  // const allDependencies = ['react'];
  // const allDevDependencies = ['eslint'];

  console.log('Installing packages. This might take a couple minutes.');
  checkIfOnline(useYarn)
    .then(isOnline => ({
      isOnline: isOnline,
    }))
    .then(info => {
      const isOnline = info.isOnline;
      console.log(
        `Installing ${chalk.cyan('react')}, ${chalk.cyan('react-dom')}, and ${chalk.cyan('dependencies')}...`
      );
      console.log();

      return install(useYarn, allDependencies, '--save', isOnline).then(
        () => ({
          isOnline: isOnline,
          allDevDependencies: allDevDependencies,
        })
      );

      // return install(useYarn, allDependencies, isOnline);
    })
    .then(info => {
      const isOnline = info.isOnline;
      const allDevDependencies = info.allDevDependencies;
      
      console.log(`${chalk.cyan('dependencies')} is installed`);
      console.log(
        `Installing ${chalk.cyan('devDependencies')}...`
      );
      console.log();

      return install(useYarn, allDevDependencies, '--save-dev', isOnline);
    })
    .then(() => {
      console.log(`${chalk.cyan('devDependencies')} is installed`);
      console.log();
      console.log(`Coping ${chalk.cyan('template')}...`);
      console.log();

      // template
      const templatePath = path.resolve(appPath, 'node_modules', templateModule, 'template');
      if(fs.existsSync(templatePath)) {
        console.log(`appPath is ${appPath}`);
        fs.copySync(templatePath, appPath);
      }else {
        console.error(
          `Could not locate supplied template: ${chalk.green(templatePath)}`
        );
        process.exit(1);
      }

      // gitignore rename
      fs.move(
        path.join(appPath, 'gitignore'),
        path.join(appPath, '.gitignore'),
        [],
        err => {
          if (err) {
            // Append if there's already a `.gitignore` file there
            if (err.code === 'EEXIST') {
              const data = fs.readFileSync(path.join(appPath, 'gitignore'));
              fs.appendFileSync(path.join(appPath, '.gitignore'), data);
              fs.unlinkSync(path.join(appPath, 'gitignore'));
            } else {
              throw err;
            }
          }
        }
      );
    })
    .then(() => {
      console.log(`${chalk.cyan('template')} is copied`);
      console.log();
      console.log(`Coping ${chalk.cyan('config')}...`);
      console.log();

      // config
      const configPath = path.resolve(appPath, 'node_modules', templateModule, 'config');
      if(fs.existsSync(configPath)) {
        // console.log(`appPath is ${appPath}`);
        fs.copySync(configPath, appPath);
      }else {
        console.error(
          `Could not locate supplied config: ${chalk.green(configPath)}`
        );
        process.exit(1);
      }

    })
    .then(() => {
      console.log(`${chalk.cyan('config')} is copied`);
      console.log();
      console.log(`${chalk.cyan(projectName)} is created`);
      // const webpackDevConfig = require(appPath + '/node_modules/polestar-template/config/webpack.dev.config');
      // webpackDevConfig.entry.app = './src/index.js';
      // webpackDevConfig.output.path = './build';

      // console.log(webpackDevConfig);
      // fs.writeFileSync(
      //   path.join(appPath, 'webpack.dev.config.js'),
      //   JSON.stringify(webpackDevConfig, null, 2)
      // );
    })
}

function checkIfOnline(useYarn) {
  if (!useYarn) {
    // Don't ping the Yarn registry.
    // We'll just assume the best case.
    return Promise.resolve(true);
  }

  return new Promise(resolve => {
    dns.lookup('registry.yarnpkg.com', err => {
      resolve(err === null);
    });
  });
}

function install(useYarn, dependencies, option, isOnline) {
  // var child = spawn('npm', ['install', '--save', 'fs-extra', 'hyperquest'], { stdio: 'inherit' });
  return new Promise((resolve, reject) => {
    let command;
    let args;
    if (useYarn) {
      command = 'yarnpkg';
      args = ['add', '--exact'];
      if (!isOnline) {
        args.push('--offline');
      }
      [].push.apply(args, dependencies);

      if (!isOnline) {
        console.log(chalk.yellow('You appear to be offline.'));
        console.log(chalk.yellow('Falling back to the local Yarn cache.'));
        console.log();
      }
    } else {
      command = 'npm';
      args = ['install', option].concat(dependencies); // '--save-exact'
    }

    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(' ')}`,
        });
        return;
      }
      resolve();
    });
  });
}