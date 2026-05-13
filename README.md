# 🌧️ Skill Alexa - Som de Chuva

Skill minimalista para dispositivos Amazon Echo que reproduz um som de chuva em loop contínuo. Perfeita para relaxar, dormir ou meditar.

## ✨ Funcionalidades

- **Play:** Inicia o som de chuva em loop infinito
- **Pause:** Pausa a reprodução
- **Resume:** Retoma a reprodução
- **Stop:** Para e encerra a skill

## 🚀 Hospedagem do Áudio (Gratuita)

O arquivo de áudio (`chuva.mp3`) está incluso neste repositório e pode ser servido via **GitHub Pages** (sem custo de transferência!)

### Configurar GitHub Pages

1. Acesse as configurações do repositório no GitHub → **Settings**
2. No menu lateral, clique em **Pages**
3. Em **Source**, selecione **Deploy from a branch**
4. Escolha a branch `main` e pasta `/ (root)`
5. Clique em **Save**
6. Aguarde alguns minutos. A URL será:
   ```
   https://SEU-USUARIO.github.io/skill-som-chuva/chuva.mp3
   ```

> 💡 **Dica:** Copie essa URL, você vai precisar dela na Lambda.

## ⚙️ Configuração da Lambda

### 1. Criar a função Lambda

- Acesse o [Console AWS Lambda](https://console.aws.amazon.com/lambda/home)
- Região: **us-east-1** (obrigatório para skills em português)
- Runtime: **Node.js 22.x**
- Handler: `index.handler`

### 2. Subir o código

Compacte a pasta `lambda/` (com `node_modules` incluso) e faça upload na função.

### 3. Configurar variáveis de ambiente (opcional)

No console da Lambda, em **Configuration → Environment variables**, você pode definir:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `AUDIO_URL` | `https://SEU-USUARIO.github.io/skill-som-chuva/chuva.mp3` | URL do seu áudio |

Se não definir `AUDIO_URL`, a Lambda usará o valor padrão configurado em `lambda/index.js`.

### 4. Adicionar Trigger

Adicione um trigger do tipo **Alexa Skills Kit** e informe o **Skill ID** da sua skill.

## 🎤 Configurar a Skill na Alexa

1. Acesse o [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Crie uma nova skill:
   - **Nome:** Som de Chuva
   - **Idioma:** Portuguese (BR)
   - **Modelo:** Custom
   - **Método:** Host your own
3. Em **Interaction Model → JSON Editor**, cole o conteúdo de `interactionModels/pt-BR.json`
4. Em **Endpoint**, informe o **ARN** da sua função Lambda
5. Em **Interfaces**, ative **AudioPlayer**
6. Salve e compile o modelo (**Build Model**)

## 🗣️ Como Usar

| Comando | Ação |
|---------|------|
| "Alexa, abrir chuva" | Inicia o som de chuva |
| "Alexa, tocar chuva" | Inicia o som de chuva |
| "Alexa, pausar" | Pausa |
| "Alexa, continuar" | Retoma |
| "Alexa, parar" | Para e fecha a skill |

## 🔒 Segurança

Arquivos com identificadores da conta AWS estão protegidos pelo `.gitignore`:
- `skill.json`
- `infra/s3-public-policy.json`
- `lambda/config.js`

Templates de exemplo (`.example`) estão disponíveis no repositório para referência.

## 📝 Requisitos do Áudio

- **Formato:** MP3 (MPEG-1 Layer III)
- **Bitrate:** 48 a 256 kbps
- **Sample rate:** 22.05kHz, 44.1kHz ou 48kHz
- **Canais:** Mono ou estéreo

> ⚠️ O arquivo original deve ser um MP3 válido. Arquivos AAC, M4A ou MP4 com extensão `.mp3` não funcionam no AudioPlayer da Alexa.

## 💰 Custo

Com GitHub Pages: **R$ 0,00** (hospedagem e transferência gratuitas)

AWS Lambda (uso moderado): Dentro do Free Tier permanente da AWS (**R$ 0,00**)

---

Feito com ❤️ para noites tranquilas.
