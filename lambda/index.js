const AUDIO_URL = process.env.AUDIO_URL || 'https://SEU-USUARIO.github.io/skill-som-chuva/chuva.mp3';
const AUDIO_TOKEN = 'rain-loop-token';

function buildPlayResponse(url, behavior = 'REPLACE_ALL') {
  return {
    version: '1.0',
    response: {
      directives: [{
        type: 'AudioPlayer.Play',
        playBehavior: behavior,
        audioItem: {
          stream: {
            token: AUDIO_TOKEN,
            url: url,
            offsetInMilliseconds: 0
          }
        }
      }],
      shouldEndSession: true
    }
  };
}

function buildStopResponse() {
  return {
    version: '1.0',
    response: {
      outputSpeech: {
        type: 'PlainText',
        text: 'Som de chuva encerrado. Até logo!'
      },
      directives: [{
        type: 'AudioPlayer.Stop'
      }],
      shouldEndSession: true
    }
  };
}

exports.handler = async (event) => {
  const requestType = event.request.type;

  console.log('Request type:', requestType);

  if (requestType === 'LaunchRequest') {
    return buildPlayResponse(AUDIO_URL, 'REPLACE_ALL');
  }

  if (requestType === 'IntentRequest') {
    const intentName = event.request.intent.name;
    console.log('Intent:', intentName);

    if (intentName === 'PlayIntent') {
      return buildPlayResponse(AUDIO_URL, 'REPLACE_ALL');
    }

    if (intentName === 'AMAZON.PauseIntent') {
      return {
        version: '1.0',
        response: {
          directives: [{ type: 'AudioPlayer.Stop' }]
        }
      };
    }

    if (intentName === 'AMAZON.ResumeIntent') {
      return buildPlayResponse(AUDIO_URL, 'REPLACE_ALL');
    }

    if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
      return buildStopResponse();
    }

    if (intentName === 'AMAZON.HelpIntent') {
      return {
        version: '1.0',
        response: {
          outputSpeech: {
            type: 'PlainText',
            text: 'Esta skill toca o som de chuva em loop. Diga "Alexa, abrir chuva" para começar, ou "Alexa, parar" para encerrar.'
          },
          shouldEndSession: true
        }
      };
    }
  }

  if (requestType === 'AudioPlayer.PlaybackNearlyFinished') {
    return buildPlayResponse(AUDIO_URL, 'ENQUEUE');
  }

  if (requestType === 'AudioPlayer.PlaybackFailed') {
    console.log('PlaybackFailed:', JSON.stringify(event.request.error));
    return { version: '1.0', response: {} };
  }

  if (requestType === 'SessionEndedRequest') {
    console.log('Session ended. Reason:', event.request.reason);
    return { version: '1.0', response: {} };
  }

  return { version: '1.0', response: {} };
};
