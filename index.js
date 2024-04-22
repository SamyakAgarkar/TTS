const express = require('express');
const app = express();
const cors = require('cors')
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const bodyParser  = require('body-parser')


app.use(cors())
app.use(bodyParser.json())


app.get('/list-voices', (req, res) => {
  const voicesDirectory = path.join(__dirname, 'voices');

  fs.readdir(voicesDirectory, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }

    const wavFiles = files.filter(file => path.extname(file) === '.wav');
    const voiceNames = wavFiles.map(file => path.parse(file).name);

    res.json({ voiceNames });
  });
});

app.get('/list-stories', (req, res) => {
  const storiesDirectory = path.join(__dirname, 'stories');

  fs.readdir(storiesDirectory, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }

    const txtFiles = files.filter(file => path.extname(file) === '.txt');
    const storyData = [];

    txtFiles.forEach(file => {
      const storyName = path.parse(file).name;
      const filePath = path.join(storiesDirectory, file);
      const storyContent = fs.readFileSync(filePath, 'utf8');

      storyData.push({ storyName, story: storyContent });
    });

    res.json({ stories: storyData });
  });
});

app.post('/run-tts', (req, res) => {

  const text = req.body.text
  const voiceName = req.body.voiceName

  const ttsCommand = 'tts';
  const ttsArguments = [
    '--text',
    text,
    '--model_name',
    'tts_models/multilingual/multi-dataset/your_tts',
    '--speaker_wav',
    `./voices/${voiceName}.wav`,
    '--language_idx',
    'en'
  ];

  const ttsProcess = spawn(ttsCommand, ttsArguments);

  ttsProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  ttsProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  ttsProcess.on('close', (code) => {
    console.log(`TTS process exited with code ${code}`);
    if (code === 0) {
      res.sendFile(path.join(__dirname, 'tts_output.wav')); // Assuming the file is in the same directory as this script
    } else {
      res.send(`TTS process exited with code ${code}`);
    }

  });

  ttsProcess.on('error', (err) => { // Added error handling for ttsProcess
    console.error(`Error running TTS command: ${err}`);
    res.send(`Error running TTS command: ${err}`);
  });
});


app.listen(5000, () => {
  console.log('Server is running on http://localhost:3000');
})
