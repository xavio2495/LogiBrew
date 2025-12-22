## How to use react inside forge app

### Dependencies
UI Kit expects your app to have the following dependencies installed at the top-level directory:

```bash
npm i react@18
npm i @forge/react@latest
```

### File structure
In UI Kit, the following directory and UI entry point file should be added to your app /src folder:
```bash
/src
  /frontend
    /index.jsx
```
In Custom UI, the following directory and UI entry point file should be added to your app /src folder:

The specified folder structure /static/src/index.js is not mandatory; instead, ensure that the index.html file is located at the path specified in your resource's configuration.
```bash
/static
  /src
    /index.js
```

### React app

In UI Kit, the React dependencies should be imported, and the Forge render method should be called in the /src/frontend/index.jsx file of your app.

```javascript
import React, { useEffect } from  'react';
import ForgeReconciler, { Box, Text } from  '@forge/react';

const App = () => (
  <Box>
    <Text>Hello, world!</Text>
  </Box>
)

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

In Custom UI, the React dependencies should be imported, and the ReactDOM render method should be called in the /static/src/index.js file of your app.

```javascript
import React from 'react';
import ReactDOM from 'react-dom';

const App = () => (
  <div>
    Hello, world!
  </div>
)

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
```

### Manifest definition
A resource should be declared in the app manifest.

```bash
resources:
- key: frontend
  path: src/frontend/index.tsx
```

### Resolver
Resolver enables you to define backend functions for your UI Kit and Custom UI apps.

The following dependency should be installed at the top-level directory of your app:

### Dependencies

npm i @forge/resolver@latest
File structure
The following directory and UI entry point file should be added to your app /src folder:

/src
  /backend
    /index.js

### Handler
The resolver dependency should be imported, and your resolvers defined in your app /src/backend/index.js file.

```javascript
import Resolver from '@forge/resolver';
const resolver = new Resolver();

resolver.define('my-example', async (req) => {
  return {
    data: 'Hello, world',
  }
});

export  const  handler  =  resolver.getDefinitions();
```

### Manifest definition
A function should be declared in the app manifest.

modules:
  function:
    - key: backend
      handler: index.handler

Attach a UI resource and resolver to an extension point
To integrate your app, it needs to be declared in a module. Modules necessitate a resource, resolver, and a render mode to display UI in a Atlassian app.

```bash
modules:
  macro:
  - key: example
    title: Example Macro
    resource: frontend
    resolver:
      function: backend
```

## Sample Code 1:

```javascript
import React from 'react';
import ForgeReconciler, { Inline, Stack, Heading, Button, Text, Lozenge, Tag } from '@forge/react';

const App = () => {

  const onEditHandler = () => {}

  return (
    <Stack space="space.200" alignInline="start">
      <Heading as="h3">Forge UI</Heading>
      <Inline space="space.200" alignBlock="start" alignInline="start">
        <Stack space="space.100" alignInline="start" grow="hug">
          <Tag color="purpleLight" text="Objective" />
          <Text> Our mission is to help unleash the potential of every team. </Text>
        </Stack>
        <Stack space="space.200" alignInline="start" grow="hug">
          <Tag color="blueLight" text="Major Milestones" />
          <Inline space="space.200">
            <Text>UI Kit 2</Text>
            <Lozenge appearance="inprogress">In Progress</Lozenge>
          </Inline>
          <Inline space="space.200">
            <Text>UI Kit 1</Text>
            <Lozenge appearance="success">Completed</Lozenge>
          </Inline>
        </Stack>
      </Inline>
      <Inline space="space.200">
        <Text>Updated on:</Text>
        <Lozenge>{new Date('2023/09/07').toISOString()}</Lozenge>
        <Stack
          space="space.050"
          alignBlock="end"
          alignInline="center"
          grow="hug"
        >
          <Button appearance="default" onClick={onEditHandler}>Edit</Button>
        </Stack>
      </Inline>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Sample Code 2

```javascript
mport React, { useState } from 'react';
import ForgeReconciler, { Heading, Image, Button, Text, Inline, Stack } from '@forge/react';
import { QuestionSet } from '../data/questions';

const App = () => {

  const [activeQuestion, setActiveQuestion] = useState(0);
  const [explanation, setExplanation] = useState('')
  const [showResult, setShowResult] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const onClickHandler = (isCorrect) => {
    if (isCorrect) {
      setExplanation('You got it right!');
      setScore(score + 1);
    } else {
      setExplanation('Incorrect, the correct answer is ' + `${QuestionSet[activeQuestion].correctAnswer}`);
    }

    setShowResult(true);
  }

  const onClickNext = () => {
    if (activeQuestion + 1 < QuestionSet.length) {
      setActiveQuestion(activeQuestion + 1);
      setShowResult(false);
    } else {
      setShowResults(true);
    }
  }

  const onClickReplay = () => {
    setActiveQuestion(0);
    setShowResult(false);
    setScore(0);
    setExplanation('');
    setShowResults(false);
  }

  const { question, options, image } = QuestionSet[activeQuestion];

  return (
    <>
      { showResults ? (
        <Stack space="space.200" alignInline="center">
          <Heading as="h3">Final score: {score} out of {QuestionSet.length} </Heading>
          <Image src={"https://media.giphy.com/media/XROOE9NApITmCgF6dZ/giphy.gif"} alt="High-five" size="small"/>
          <Button appearance="primary" onClick={onClickReplay}>
              Replay
          </Button>
        </Stack>
      ) : ( 
      <Stack space="space.200" alignInline="center">
        <Heading as="h3">{question}</Heading>
        <Image src={image ? image : "https://media.giphy.com/media/xUOxfjsW9fWPqEWouI/giphy.gif"} alt="Founders" size="xsmall" />
        <Inline space="space.200" alignBlock="center" alignInline="center">
          <Stack space="space.200" grow="hug">
            <Button appearance="primary" onClick={() => onClickHandler(options[0].isCorrect)} disabled={showResult ? true : false}>
              {options[0].option}
            </Button>
            <Button appearance="primary" onClick={() => onClickHandler(options[2].isCorrect)} disabled={showResult ? true : false}>
              {options[2].option}
            </Button>
          </Stack>
          <Stack space="space.200" grow="hug">
            <Button appearance="primary" onClick={() => onClickHandler(options[1].isCorrect)} disabled={showResult ? true : false}>
              {options[1].option}
            </Button>
            <Button appearance="primary" onClick={() => onClickHandler(options[3].isCorrect)} disabled={showResult ? true : false}>
              {options[3].option}
            </Button>
          </Stack>
        </Inline>
        <Text>{showResult ? explanation : null}</Text>
        <Button appearance="default" onClick={onClickNext} disabled={showResult ? false : true}>{ activeQuestion == QuestionSet.length-1 ? 'Finish' : 'Next Question'}</Button>
        <Text>Question {activeQuestion + 1} of {QuestionSet.length}</Text>
      </Stack> )
      }
    </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

```

## Sample Code 3

```javascript
import React, { useState, useEffect, useRef } from 'react';
import ForgeReconciler, { 
  FilePicker, 
  FileCard, 
  Box, 
  Heading, 
  Text, 
  Stack,
  SectionMessage,
  List,
  ListItem,
  useObjectStore
} from '@forge/react';

type SerializedFile = {
  data: string;
  name: string;
  size: number;
  type: string;
}

const App: React.FC = () => {
  // Map Object Store keys to original file names (objectStates tracks the rest)
  const [fileNameMap, setFileNameMap] = useState<Record<string, string>>({});
  
  // Local loading state for instant feedback
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);
  
  // Track pending uploads with their file names
  const pendingUploadsRef = useRef<Array<{ name: string; type: string; size: number }>>([]);
  
  // Hook for Object Store operations (upload, download, delete, getMetadata)
  // objectStates tracks: key, objectType, objectSize, success, error, isUploading, isDeleting
  const { uploadObjects, downloadObjects, deleteObjects, objectStates } = useObjectStore();
  
  // Map file names when objectStates updates with new successful uploads
  useEffect(() => {
    if (pendingUploadsRef.current.length === 0) return;
    
    // Find recently completed uploads (success === true and not yet mapped)
    const unmappedStates = objectStates.filter(
      state => state.success && state.key && !fileNameMap[state.key]
    );
    
    if (unmappedStates.length > 0) {
      const updatedFileNameMap = { ...fileNameMap };
      
      unmappedStates.forEach((state, index) => {
        const pendingUpload = pendingUploadsRef.current[index];
        if (pendingUpload && state.objectSize === pendingUpload.size) {
          updatedFileNameMap[state.key] = pendingUpload.name;
        }
      });
      
      setFileNameMap(updatedFileNameMap);
      pendingUploadsRef.current = [];
    }
  }, [objectStates, fileNameMap]);

  // Upload files automatically when selected/dropped
  const handleFileSelection = async (files: any) => {
    // FilePicker passes an array-like object, not a true array - convert it
    const actualFiles: SerializedFile[] = Object.keys(files)
      .filter(key => !isNaN(Number(key)))  // Only numeric keys
      .map(key => files[key]);
    
    if (!actualFiles || actualFiles.length === 0) {
      return;
    }

    try {
      // Set loading state immediately for instant feedback
      setIsUploadingLocal(true);
      
      // Store pending uploads so useEffect can map them when objectStates updates
      pendingUploadsRef.current = actualFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size
      }));
      
      // Convert SerializedFile to Base64Object format for uploadObjects
      const base64Objects = actualFiles.map(file => ({
        data: file.data,
        mimeType: file.type,
        fileSize: file.size
      }));
      
      // Upload files as Base64 objects
      await uploadObjects({
        functionKey: 'uploadObjects',
        objects: base64Objects
      });
    } catch (error) {
      // Error state tracked in objectStates
    } finally {
      setIsUploadingLocal(false);
    }
  };

  // Delete file from Object Store
  const handleDeleteFile = async (fileKey: string): Promise<void> => {
    try {
      await deleteObjects({
        functionKey: 'deleteObjects',
        keys: [fileKey]
      });
      
      // Remove file name mapping
      const updatedFileNameMap = { ...fileNameMap };
      delete updatedFileNameMap[fileKey];
      setFileNameMap(updatedFileNameMap);
    } catch (error) {
      // Error handled by objectStates
    }
  };

  // Download file from Object Store
  // Returns the blob so FileCard can trigger the browser download
  const handleDownloadFile = async (fileKey: string): Promise<Blob | void> => {
    try {
      const results = await downloadObjects({
        functionKey: 'downloadObjects',
        keys: [fileKey]
      });
      
      if (results && results.length > 0) {
        const result = results[0];
        
        if (result.success && result.blob) {
          // Return the blob so FileCard can trigger browser download
          return result.blob;
        }
      }
    } catch (error) {
      // Error handled by objectStates
    }
  };

  const uploadedFiles = objectStates.filter(state => state.success && !state.isDeleting);
  const isUploading = isUploadingLocal || objectStates.some(state => state.isUploading);

  return (
    <Box padding="space.300">
      <Stack space="space.300">
        <Box>
          <Heading size="large">File Upload with Object Store</Heading>
          <Text>Upload files using the FilePicker below</Text>
        </Box>

        <Box>
          <Stack space="space.200">
            <Heading size="medium">Select or Drop Files</Heading>
            <FilePicker onChange={handleFileSelection} />
            
            {isUploading && (
              <SectionMessage appearance="information">
                <Text>Uploading files...</Text>
              </SectionMessage>
            )}
            
            {objectStates.some(state => state.error) && (
              <SectionMessage appearance="error">
                <Text>Upload failed: {objectStates.find(state => state.error)?.error}</Text>
              </SectionMessage>
            )}
          </Stack>
        </Box>

        <Box>
          <Stack space="space.200">
            <Heading size="medium">Uploaded Files ({uploadedFiles.length})</Heading>
            
            {uploadedFiles.length === 0 ? (
              <Text>No files uploaded yet. Use the file picker above to upload files.</Text>
            ) : (
              <Stack space="space.200">
                {uploadedFiles.map((fileState) => (
                <Box key={fileState.key}>
                  <FileCard
                    fileName={fileNameMap[fileState.key] || 'Unknown file'}
                    fileType={fileState.objectType || 'application/octet-stream'}
                    fileSize={fileState.objectSize || 0}
                    onDelete={() => handleDeleteFile(fileState.key)}
                    onDownload={() => handleDownloadFile(fileState.key)}
                    isUploading={fileState.isUploading}
                    uploadProgress={75} // Mock progress for performance
                  />
                </Box>
              ))}
              </Stack>
            )}
          </Stack>
        </Box>

        <Box>
          <SectionMessage appearance="information">
            <Text>How to use:</Text>
            <List type="ordered">
              <ListItem>Click to browse or drag and drop files into the FilePicker</ListItem>
              <ListItem>Files are automatically uploaded to Object Store</ListItem>
              <ListItem>View uploaded files as FileCards with their metadata</ListItem>
              <ListItem>Use the download button to retrieve files from Object Store</ListItem>
              <ListItem>Use the delete button to remove files from Object Store</ListItem>
            </List>
          </SectionMessage>
        </Box>
      </Stack>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

```

## Sample Code 4

```javascript
mport Resolver from '@forge/resolver';
import os from '@forge/os';

const resolver = new Resolver();

// =====================================================
// OBJECT STORE RESOLVERS
// These resolvers work with the useObjectStore hook
// from @forge/react to provide Object Store operations
// =====================================================

/**
 * Resolver for objectStore.upload() bridge method
 * 
 * Flow:
 * 1. Bridge calculates metadata (length, checksum) for each Blob
 * 2. Bridge calls this resolver with { allObjectMetadata }
 * 3. Resolver generates presigned URLs and returns PresignedURLMapping
 * 4. Bridge uploads each Blob to its presigned URL
 * 5. Bridge returns UploadResult[] to frontend
 * 
 * Receives: { allObjectMetadata: ObjectMetadata[] }
 *   where ObjectMetadata = { length: number, checksum: string (base64), checksumType: string }
 * 
 * Returns: PresignedURLMapping = { [presignedUrl: string]: FileMetadata }
 *   where FileMetadata = { key: string, length: number, checksum: string, checksumType: string, ttlSeconds?, overwrite? }
 */
resolver.define('uploadObjects', async (req) => {
  try {
    const { allObjectMetadata } = req.payload || {};
    
    if (!allObjectMetadata || !Array.isArray(allObjectMetadata)) {
      throw new Error('Missing or invalid allObjectMetadata array parameter');
    }
    
    const presignedURLMapping = {};
    
    // Generate presigned URL for each object metadata
    for (let i = 0; i < allObjectMetadata.length; i++) {
      const metadata = allObjectMetadata[i];
      const { length, checksum, checksumType } = metadata;
      
      // Generate a unique key for this object
      const key = `object-${Date.now()}-${i}-${checksum.substring(0, 8)}`;
      
      try {
        // Create presigned upload URL using Object Store API
        const uploadUrlResponse = await os.createUploadUrl({
          key,
          length,
          checksum,
          checksumType,
          ttlSeconds: 3600,
          overwrite: true,
        });
        
        if (!uploadUrlResponse.url) {
          continue;
        }
        
        // Map presigned URL to file metadata
        presignedURLMapping[uploadUrlResponse.url] = {
          key,
          length,
          checksum,
          checksumType,
          ttlSeconds: 3600,
          overwrite: true
        };
        
      } catch (error) {
        // Continue with other objects
      }
    }
    
    return presignedURLMapping;
    
  } catch (error) {
    throw error;
  }
});

/**
 * Resolver for objectStore.download() bridge method
 * 
 * Flow:
 * 1. Bridge calls this resolver with { keys }
 * 2. Resolver generates download URLs and returns DownloadURLMapping
 * 3. Bridge downloads each object from its download URL
 * 4. Bridge returns DownloadResult[] to frontend
 * 
 * Receives: { keys: string[] }
 * Returns: DownloadURLMapping = { [downloadUrl: string]: key }
 */
resolver.define('downloadObjects', async (req) => {
  try {
    const { keys } = req.payload || {};
    
    if (!keys || !Array.isArray(keys)) {
      throw new Error('Missing or invalid keys array parameter');
    }
    
    const downloadURLMapping = {};
    
    // Generate download URL for each key
    for (const key of keys) {
      try {
        // Get download URL from Object Store
        const downloadUrlResponse = await os.createDownloadUrl(key);
        
        if (!downloadUrlResponse.url) {
          continue;
        }
        
        // Map download URL to key
        downloadURLMapping[downloadUrlResponse.url] = key;
        
      } catch (error) {
        // Continue with other keys
      }
    }
    
    return downloadURLMapping;
    
  } catch (error) {
    throw error;
  }
});

/**
 * Resolver for objectStore.getMetadata() bridge method
 * 
 * Flow:
 * 1. Bridge calls this resolver ONCE PER KEY with { key }
 * 2. Resolver returns GetMetadataResult for that key
 * 3. Bridge collects all results and returns GetMetadataResult[] to frontend
 * 
 * Receives: { key: string }  (NOTE: single key, not array!)
 * Returns: GetMetadataResult = { key, checksum?, size?, createdAt?, currentVersion?, error? }
 */
resolver.define('getObjectsMetadata', async (req) => {
  try {
    const { key } = req.payload || {};
    
    if (!key) {
      return {
        key: 'unknown',
        error: 'Missing key parameter'
      };
    }
    
    try {
      // Get object metadata from Object Store
      const metadata = await os.get(key);
      
      // os.get() returns undefined if object doesn't exist
      if (!metadata) {
        return {
          key,
          error: 'Object not found'
        };
      }
      
      return {
        key,
        checksum: metadata.checksum,
        size: metadata.size,  // Property is 'size', not 'length'
        createdAt: metadata.createdAt,
        currentVersion: metadata.currentVersion
      };
      
    } catch (error) {
      return {
        key,
        error: error.message
      };
    }
    
  } catch (error) {
    return {
      key: 'unknown',
      error: error.message || 'Unknown error occurred'
    };
  }
});

/**
 * Resolver for objectStore.delete() bridge method
 * 
 * Flow:
 * 1. Bridge calls this resolver ONCE PER KEY with { key }
 * 2. Resolver deletes the object (return value is ignored)
 * 3. Bridge waits for all deletions to complete
 * 4. Bridge returns void to frontend
 * 
 * Receives: { key: string }  (NOTE: single key, not array!)
 * Returns: void (anything, it's ignored)
 */
resolver.define('deleteObjects', async (req) => {
  try {
    const { key } = req.payload || {};
    
    if (!key) {
      throw new Error('Missing key parameter');
    }
    
    // Delete the object from Object Store
    await os.delete(key);
    
    // Return void (or undefined, doesn't matter)
    return undefined;
    
  } catch (error) {
    throw error; // Re-throw to be caught by bridge
  }
});

export const handler = resolver.getDefinitions();
```