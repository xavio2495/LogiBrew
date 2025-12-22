The below error occurs when 'forge deploy' is run on CLI.
I suppose the issue arises from a mismatch in node-modules. Lets fix this togethor.

Use forge-knowledge mcp server to get more context to solve this error.

```bash
i Packaging app files
  Packaging bundled files
  , from 321.cjs
  , from 321.cjs.map
  , from __forge__.cjs
  , from __forge_wrapper__.cjs
  , from index.cjs
  , from index.cjs.map
  , from runtime.json
  , from manifest.yml
  , from package.json
  , from package-lock.json
  Archive created: C:\Users\xavio\AppData\Local\Temp\tmp-18712-BtadojTvTtSG-.zip

Error: Bundling failed: Module build failed (from C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\node_modules\ts-loader\index.js):
Error: TypeScript emitted no output for D:\LogiBrew\logibrew-x1\src\knowledge-base\index.tsx.       
    at makeSourceMapAndFinish (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\node_modules\ts-loader\dist\index.js:55:18)
    at successLoader (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\node_modules\ts-loader\dist\index.js:42:5)
    at Object.loader (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\node_modules\ts-loader\dist\index.js:23:5), [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,78)
      TS1139: Type parameter declaration expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,84)
      TS1005: ',' expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,95)
      TS1005: ',' expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,112)
      TS1005: ',' expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,127)
      TS1109: Expression expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,166)
      TS1005: ';' expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,204)
      TS1005: ';' expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,322)
      TS1005: ')' expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,405)
      TS1005: ';' expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,407)
      TS1128: Declaration or statement expected.

Error: Bundling failed: Module build failed (from C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\node_modules\ts-loader\index.js):
Error: TypeScript emitted no output for D:\LogiBrew\logibrew-x1\src\knowledge-base\index.tsx.       
    at makeSourceMapAndFinish (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\node_modules\ts-loader\dist\index.js:55:18)
    at successLoader (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\node_modules\ts-loader\dist\index.js:42:5)
    at Object.loader (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\node_modules\ts-loader\dist\index.js:23:5), [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,78)
      TS1139: Type parameter declaration expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,84)
      TS1005: ',' expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,95)
      TS1005: ',' expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,112)
      TS1005: ',' expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,127)
      TS1109: Expression expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,166)
      TS1005: ';' expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,204)
      TS1005: ';' expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,322)
      TS1005: ')' expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,405)
      TS1005: ';' expected., [tsl] ERROR in D:\LogiBrew\logibrew-x1\node_modules\react-hook-form\dist\watch.d.ts(46,407)
      TS1128: Declaration or statement expected.
    at C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\node_modules\@forge\bundler\out\nativeui.js:28:23
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async Promise.all (index 4)
    at async NativeUIBundler.bundleResources (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\node_modules\@forge\bundler\out\nativeui.js:14:9)
    at async AppPackager.package (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\out\deploy\packager\packager.js:20:32)
    at async PackageUploadDeployCommand.packageUpload (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\out\deploy\package-upload-deploy.js:53:76)
    at async PackageUploadDeployCommand.execute (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\out\deploy\package-upload-deploy.js:34:85)
    at async CommandLineUI.displayProgress (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\node_modules\@forge\cli-shared\out\ui\command-line-ui.js:97:28)
    at async DeployView.reportDeploymentProgress (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\out\command-line\view\deploy-view.js:102:24)
    at async DeployController.run (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\out\command-line\controller\deploy-controller.js:217:27)
    at async C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\out\command-line\register-deployment-commands.js:30:9
    at async Command.actionProcessor (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\out\command-line\command.js:280:28)
    at async Command.parseAsync (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\node_modules\commander\lib\command.js:1104:5)
    at async Command.parse (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\out\command-line\command.js:165:13)
    at async main (C:\Users\xavio\AppData\Roaming\npm\node_modules\@forge\cli\out\command-line\index.js:89:5)

```