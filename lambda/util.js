const AWS = require('aws-sdk');
const config = require('./config');

const s3 = new AWS.S3({ region: process.env.AWS_REGION || 'us-east-1' });

function getAudioUrl() {
  // Opção A (simples): bucket público com URL fixa
  // return `https://s3.us-east-1.amazonaws.com/${config.S3_BUCKET}/${config.S3_KEY}`;

  // URL de teste pública da Amazon (MP3 válido conhecido)
  return 'https://s3.amazonaws.com/ask-samples-resources/audiostreams/fox-dog.mp3';

  // Opção B: URL pré-assinada válida por 2 horas
  // return s3.getSignedUrl('getObject', {
  //   Bucket: config.S3_BUCKET,
  //   Key: config.S3_KEY,
  //   Expires: 7200
  // });
}

function buildPlayDirective(url, behavior = 'REPLACE_ALL') {
  return {
    type: 'AudioPlayer.Play',
    playBehavior: behavior,
    audioItem: {
      stream: {
        url: url,
        token: config.AUDIO_TOKEN,
        offsetInMilliseconds: 0
      }
    }
  };
}

function buildStopDirective() {
  return {
    type: 'AudioPlayer.Stop'
  };
}

module.exports = {
  getAudioUrl,
  buildPlayDirective,
  buildStopDirective
};
