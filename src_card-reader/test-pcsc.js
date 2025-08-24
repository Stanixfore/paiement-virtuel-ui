const pcsclite = require('pcsclite');
const pcsc = pcsclite();

const APDUs = [
  // Cartes bancaires
  {
    name: 'Carte Visa (AID Visa)',
    apdu: Buffer.from([0x00, 0xA4, 0x04, 0x00, 0x07, 0xA0, 0x00, 0x00, 0x00, 0x03, 0x10, 0x10])
  },
  {
    name: 'Carte Mastercard (AID Mastercard)',
    apdu: Buffer.from([0x00, 0xA4, 0x04, 0x00, 0x07, 0xA0, 0x00, 0x00, 0x00, 0x04, 0x10, 0x10])
  },
  // Carte Vitale (exemple APDU générique sur fichier racine)
  {
    name: 'Carte Vitale (Sélection générique 3F00)',
    apdu: Buffer.from([0x00, 0xA4, 0x00, 0x00, 0x02, 0x3F, 0x00])
  },
  // Carte d’identité électronique française (EGD)
  {
    name: 'Carte d\'identité électronique (AID CIE)',
    apdu: Buffer.from([0x00, 0xA4, 0x04, 0x0C, 0x07, 0xA0, 0x00, 0x00, 0x00, 0x63, 0x50, 0x4B, 0x43])
  },
  // Carte 4e génération (BAL/CNIe)
  {
    name: 'Carte Nationale d\'Identité Electronique - BAL',
    apdu: Buffer.from([0x00, 0xA4, 0x04, 0x0C, 0x0F, 0x4D, 0x41, 0x52, 0x4B, 0x50, 0x4F, 0x53, 0x49, 0x54, 0x49, 0x46, 0x52, 0x49, 0x43, 0x41, 0x54])
  },
  // Carte vierge / autre APDU générique
  {
    name: 'Sélection générique 3F00',
    apdu: Buffer.from([0x00, 0xA4, 0x00, 0x00, 0x02, 0x3F, 0x00])
  }
];

function parseTLV(buffer) {
  const tlv = {};
  let i = 0;
  while (i < buffer.length) {
    let tag = buffer[i++];
    if ((tag & 0x1F) === 0x1F) {
      let nextTag;
      do {
        nextTag = buffer[i++];
        tag = (tag << 8) | nextTag;
      } while (nextTag & 0x80);
    }
    let length = buffer[i++];
    if (length & 0x80) {
      const n = length & 0x7F;
      length = 0;
      for (let j = 0; j < n; j++) {
        length = (length << 8) + buffer[i++];
      }
    }
    const value = buffer.slice(i, i + length);
    i += length;
    tlv[tag.toString(16).toUpperCase()] = value;
  }
  return tlv;
}

pcsc.on('reader', (reader) => {
  console.log('Lecteur détecté:', reader.name);

  reader.on('status', (status) => {
    const changes = reader.state ^ status.state;

    if (changes & reader.SCARD_STATE_PRESENT && status.state & reader.SCARD_STATE_PRESENT) {
      console.log('Carte insérée');

      function tryConnect(protocols) {
        if (protocols.length === 0) {
          console.error('Impossible de se connecter au protocole de la carte.');
          return;
        }
        const protocolToTry = protocols.shift();

        reader.connect({ share_mode: reader.SCARD_SHARE_SHARED, preferred_protocols: protocolToTry }, (err, protocol) => {
          if (err) {
            console.log(`Échec connexion avec protocole ${protocolToTry}, essai suivant.`);
            tryConnect(protocols);
            return;
          }
          console.log('Connecté, protocole:', protocol);

          const sendAPDUs = (index = 0) => {
            if (index >= APDUs.length) {
              console.log('Aucun AID compatible détecté.');
              return;
            }
            const { name, apdu } = APDUs[index];
            console.log(`Envoi APDU pour détection: ${name}`);

            reader.transmit(apdu, 256, protocol, (err, response) => {
              if (err) {
                console.error(`Erreur transmission APDU (${name}):`, err);
                sendAPDUs(index + 1);
                return;
              }
              const responseHex = response.toString('hex').toUpperCase();
              const sw1sw2 = response.slice(-2).toString('hex').toUpperCase();

              console.log(`Réponse APDU (${name}):`, responseHex);

              if (sw1sw2 === '9000') {
                console.log(`Carte reconnue comme : ${name}`);

                const data = response.slice(0, -2);
                const tlv = parseTLV(data);
                console.log('Données TLV:', tlv);

                // Ici, tu peux étendre pour lire plus de fichiers spécifiques à chaque carte

              } else {
                console.log(`APDU ${name} non reconnu, code statut: ${sw1sw2}`);
                sendAPDUs(index + 1);
              }
            });
          };

          sendAPDUs();
        });
      }

      tryConnect([reader.SCARD_PROTOCOL_T1, reader.SCARD_PROTOCOL_T0]);
    }

    if (changes & reader.SCARD_STATE_EMPTY && status.state & reader.SCARD_STATE_EMPTY) {
      console.log('Carte retirée');
      reader.disconnect(reader.SCARD_LEAVE_CARD, (err) => {
        if (err) console.error('Erreur déconnexion:', err);
        else console.log('Carte déconnectée');
      });
    }
  });

  reader.on('error', (err) => {
    console.error('Erreur lecteur:', err.message);
  });

  reader.on('end', () => {
    console.log('Lecteur déconnecté');
  });
});

pcsc.on('error', (err) => {
  console.error('Erreur PCSC:', err.message);
});
