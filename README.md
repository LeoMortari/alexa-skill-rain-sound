# Skill Alexa — Som de Chuva

Skill para dispositivos Amazon Echo que reproduz um MP3 de som de chuva em loop contínuo. Útil para relaxar, dormir ou meditar.

## Funcionalidades

| Comando | Ação |
|---------|------|
| "Alexa, abrir chuva" | Inicia reprodução |
| "Alexa, tocar chuva" | Inicia reprodução |
| "Alexa, pausar" | Pausa |
| "Alexa, continuar" | Retoma |
| "Alexa, parar" | Encerra a skill |

## Pré-requisitos

- Conta [AWS](https://aws.amazon.com/) (Free Tier basta)
- Conta [Amazon Developer](https://developer.amazon.com/) (criar a skill)
- Node.js 22+ instalado localmente (apenas se for usar a Opção B com `aws-sdk`)
- Git

## Estrutura do projeto

```
skill-som-chuva/
├── chuva.mp3                       # Arquivo de áudio (substitua pelo seu, mas mantenha o mesmo nome de arquivo)
├── README.md
├── plan.md                         # Documentação técnica detalhada
│
├── skill.json.example              # Template do manifest (copiar para skill.json)
├── skill.json                      # Manifest real (gitignored — contém ARN da Lambda)
│
├── interactionModels/pt-BR.json    # Modelo de interação (console web)
├── skill-package/                  # Mesmo conteúdo, formato ASK CLI v2
│   └── interactionModels/pt-BR.json
│
├── lambda/                         # Código da função Lambda
│   ├── index.js                    # Entry point (usa AUDIO_URL via ENV)
│   ├── config.js.example           # Template (copiar para config.js)
│   ├── config.js                   # Config real (gitignored — bucket S3)
│   ├── util.js                     # Helpers para fluxo S3 (Opção B, opcional)
│   ├── package.json
│   └── handlers/                   # Handlers modulares (referência)
│
└── infra/
    ├── s3-public-policy.json.example   # Template de policy IAM
    └── s3-public-policy.json           # Policy real (gitignored — bucket ARN)
```

> Os arquivos com sufixo `.example` são templates públicos. Os arquivos sem sufixo contêm identificadores reais (account ID, bucket, ARN) e estão no `.gitignore`.

## Setup local

```bash
git clone https://github.com/LeoMortari/alexa-skill-rain-sound.git
cd alexa-skill-rain-sound

# Copie os templates e preencha com seus dados
cp skill.json.example skill.json
cp lambda/config.js.example lambda/config.js
cp infra/s3-public-policy.json.example infra/s3-public-policy.json

# Instale dependências (apenas necessário para a Opção B — fluxo S3)
cd lambda && npm install
```

Edite os arquivos copiados substituindo placeholders:
- `skill.json` → campo `endpoint.uri`: ARN real da Lambda
- `lambda/config.js` → `S3_BUCKET`: nome do bucket (apenas Opção B)
- `infra/s3-public-policy.json` → ARN do bucket (apenas Opção B)

## Hospedagem do áudio

Há duas opções. Escolha **uma**:

### Opção A — GitHub Pages (recomendada, gratuita)

O `chuva.mp3` já está no repositório. Para servir via GitHub Pages:

1. Repositório no GitHub → **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. Branch: `main`, pasta: `/ (root)` → **Save**
4. Após alguns minutos, a URL fica disponível em:
   ```
   https://SEU-USUARIO.github.io/SEU-REPO/chuva.mp3
   ```

Esta URL será usada na variável de ambiente `AUDIO_URL` da Lambda.

### Opção B — Bucket S3 público

Use se preferir hospedar na AWS. Requer `aws-sdk` empacotado com a Lambda.

```bash
aws s3 mb s3://NOME-DO-SEU-BUCKET
aws s3 cp chuva.mp3 s3://NOME-DO-SEU-BUCKET/chuva.mp3
aws s3api put-bucket-policy --bucket NOME-DO-SEU-BUCKET \
  --policy file://infra/s3-public-policy.json
```

Neste caso, edite `lambda/index.js` para importar `util.js`:
```js
const { getAudioUrl } = require('./util');
const AUDIO_URL = getAudioUrl();
```

## Deploy da Lambda

### 1. Criar a função

- Console: [AWS Lambda](https://console.aws.amazon.com/lambda/home)
- Região: **us-east-1** (obrigatório para skills em pt-BR)
- Runtime: **Node.js 22.x**
- Handler: `index.handler`

### 2. Empacotar e enviar o código

**Opção A (GitHub Pages):** não há dependências externas. Zipe apenas:
```
lambda/index.js
lambda/handlers/*       (opcional — referência)
```

**Opção B (S3):** instale e inclua dependências:
```bash
cd lambda && npm install --production
zip -r ../lambda.zip . -x "*.example"
```

Faça upload do zip no console da Lambda.

### 3. Variáveis de ambiente

Em **Configuration → Environment variables**:

| Variável | Valor | Obrigatória |
|----------|-------|-------------|
| `AUDIO_URL` | URL pública do MP3 | **Sim** (Opção A) |
| `S3_BUCKET` | Nome do bucket | Sim (Opção B) |
| `S3_KEY` | `chuva.mp3` | Não (default) |
| `AWS_REGION` | `us-east-1` | Não (default) |

> Sem `AUDIO_URL` na Opção A, a Lambda cai no fallback `SEU-USUARIO.github.io/...` que **não é uma URL válida** e falhará ao reproduzir.

### 4. Trigger

Adicione trigger **Alexa Skills Kit** e informe o **Skill ID** (gerado no passo seguinte, após criar a skill).

## Criar a skill no Alexa Console

1. [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask) → **Create Skill**
2. Configure:
   - Nome: `Som de Chuva`
   - Idioma: `Portuguese (BR)`
   - Modelo: `Custom`
   - Método de hospedagem: `Provision your own`
3. **Interaction Model → JSON Editor**: cole o conteúdo de `interactionModels/pt-BR.json` e clique em **Save Model** → **Build Model**
4. **Endpoint → AWS Lambda ARN**: informe o ARN da função criada acima
5. **Interfaces**: ative **AudioPlayer**
6. Copie o **Skill ID** (topo da página) e cole no trigger da Lambda (passo 4 anterior)
7. **Test** → ativar modo *Development* → testar com "abrir chuva"

## Segurança

Os arquivos a seguir contêm identificadores únicos da sua conta AWS e estão no `.gitignore`:

| Arquivo | O que expõe |
|---------|-------------|
| `skill.json` | ARN da Lambda (inclui Account ID de 12 dígitos) |
| `lambda/config.js` | Nome do bucket S3 |
| `infra/s3-public-policy.json` | ARN do bucket S3 |

Os templates `.example` versionados no repositório usam placeholders genéricos (`SEU_ACCOUNT_ID`, `NOME-DO-SEU-BUCKET`) e são seguros para projetos públicos.

## Requisitos do áudio

- **Formato:** MP3 (MPEG-1 Layer III)
- **Bitrate:** 48–256 kbps
- **Sample rate:** 22,05 / 44,1 / 48 kHz
- **Canais:** mono ou estéreo

> Arquivos AAC, M4A ou MP4 renomeados para `.mp3` **não funcionam** no AudioPlayer da Alexa. Verifique com `ffprobe chuva.mp3` ou `file chuva.mp3`.

## Troubleshooting

| Sintoma | Causa provável |
|---------|----------------|
| "Houve um problema com a resposta da skill" | ARN da Lambda errado no endpoint, ou trigger Alexa não configurado |
| Skill abre mas não toca som | `AUDIO_URL` não definida, ou MP3 inválido (formato incorreto) |
| "InvalidResponse" no AudioPlayer | URL precisa ser **HTTPS** e o servidor precisa devolver `Content-Type: audio/mpeg` |
| GitHub Pages retorna 404 | Aguarde alguns minutos após ativar; verifique se branch e pasta estão corretos |

## Custo

- **GitHub Pages:** gratuito (hospedagem e tráfego)
- **AWS Lambda:** dentro do Free Tier permanente para uso típico
- **S3 (Opção B):** alguns centavos por mês com uso baixo

## Referências

- [`plan.md`](./plan.md) — documentação técnica completa (arquitetura, decisões, fluxo)
- [Alexa AudioPlayer Interface](https://developer.amazon.com/en-US/docs/alexa/custom-skills/audioplayer-interface-reference.html)
- [ASK CLI](https://developer.amazon.com/en-US/docs/alexa/smapi/quick-start-alexa-skills-kit-command-line-interface.html)

## Licença

Projeto pessoal sem licença formal. Sinta-se livre para clonar, adaptar e usar.
