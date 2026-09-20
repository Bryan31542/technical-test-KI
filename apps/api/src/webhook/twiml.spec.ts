import { toTwimlMessage } from './twiml';

describe('toTwimlMessage', () => {
  it('wraps the reply in a Twilio Message verb and escapes XML', () => {
    expect(toTwimlMessage('Fechas <ciclo> & matrícula')).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Fechas &lt;ciclo&gt; &amp; matrícula</Message></Response>',
    );
  });
});
