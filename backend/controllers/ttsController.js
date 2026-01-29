const asyncHandler = require('../utils/asyncHandler');
const { groqTextToSpeech } = require('../utils/interviewEngine');

// POST /api/tts
// Body: { text: string, voice?: string, model?: string, responseFormat?: 'wav'|'mp3'|'flac'|'opus' }
const synthesizeSpeech = asyncHandler(async (req, res) => {
  const {
    text = '',
    voice = 'troy',
    model = 'canopylabs/orpheus-v1-english',
    responseFormat = 'wav',
  } = req.body || {};

  const audio = await groqTextToSpeech({ text, voice, model, responseFormat });

  const fmt = (responseFormat || 'wav').toString();
  const contentType = fmt === 'mp3'
    ? 'audio/mpeg'
    : fmt === 'flac'
      ? 'audio/flac'
      : fmt === 'opus'
        ? 'audio/opus'
        : 'audio/wav';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'no-store');
  res.send(audio);
});

module.exports = {
  synthesizeSpeech,
};
