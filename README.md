# 📡 SignalDegen - Cryptocurrency Trading Signals Platform

**Smart Signals for Bold Traders** | **Sinais Inteligentes para Traders Ousados**

A professional cryptocurrency trading signals platform featuring real-time technical analysis, high-risk opportunities, and backtesting capabilities. Built with vanilla JavaScript, HTML5, and CSS3.

---

## 🇺🇸 English

### 🎯 Features

- **🟢 Safe Signals**: Signals based on solid technical analysis (RSI, MACD, EMA, Bollinger Bands, Volume)
- **🔥 Degen Zone**: High-risk opportunities including:
  - New listings (early detection)
  - Memecoins tracking
  - Whale movement alerts
  - Arbitrage opportunities
- **📈 Backtesting Simulator**: Test trading strategies with historical data
- **⚡ Real-Time Updates**: Live price updates and signal scoring
- **🌐 Multi-Language**: Full support for Portuguese and English
- **📱 Fully Responsive**: Perfect experience on mobile, tablet, and desktop
- **🎨 Modern UI**: Purple/black theme with smooth animations and effects

### 🚀 Quick Start

1. **Clone or download** the project
2. **Open `index.html`** in any modern browser
3. **That's it!** No build process or dependencies required

```bash
# Option 1: Open directly
open index.html  # macOS
start index.html  # Windows
xdg-open index.html  # Linux

# Option 2: Use a local server (recommended)
python -m http.server 8000
# Then visit http://localhost:8000

# Option 3: Using Node.js
npx http-server -p 8000
```

### 📁 Project Structure

```
SignalDegen/
├── index.html          # Main HTML structure
├── styles.css          # All styles (purple/black theme)
├── script.js           # JavaScript (language system, animations, interactions)
└── README.md           # Documentation (this file)
```

### 🎨 Design System

**Color Palette:**
- Background: `#0a0a0f` (primary), `#1a1a2e` (cards)
- Purple: `#8b5cf6` (primary), `#a78bfa` (secondary), `#c084fc` (highlights), `#6d28d9` (hover)
- Signals: Green (`#10b981` buy), Red (`#ef4444` sell), Orange (`#f59e0b` hold)

**Typography:**
- Primary: Inter (Google Fonts)
- Monospace: JetBrains Mono (for numbers/prices)

**Effects:**
- Card hover: lift + purple glow
- Animated hero gradient
- Pulse animations on score badges
- Smooth transitions (0.3s ease)

### 🌐 Language System

The platform supports **Portuguese (PT-BR)** and **English (EN)**.

- Click the flag buttons (🇧🇷 or 🇺🇸) in the header to switch
- Language preference is saved in localStorage
- Default language: Portuguese
- Toast notification confirms language change

**For Developers:**

```javascript
// Change language programmatically
SignalDegen.changeLang('en');  // or 'pt'

// Get translation
SignalDegen.t('hero.subtitle');  // Returns translated text

// Show toast notification
SignalDegen.showToast('Custom message');
```

### 📊 Signal Types

**Safe Signals:**
- STRONG BUY (Score 80+)
- BUY (Score 60-79)
- HOLD (Score 40-59)
- SELL (Score <40)

**Degen Zone:**
- Risk levels: EXTREME, VERY HIGH, MEDIUM, LOW
- Categories: New Listings, Memecoins, Whale Alerts, Arbitrage

### 🛠️ Customization

**Adding New Signals:**

Edit the HTML in `index.html` to add more signal cards. Copy the structure:

```html
<div class="signal-card">
    <div class="card-header">
        <h3 class="pair">YOUR_PAIR/USDT</h3>
        <div class="score-badge pulse">
            <span class="score-label" data-i18n="common.score">Score</span>
            <span class="score-value">75</span>
        </div>
    </div>
    <!-- ... rest of the card -->
</div>
```

**Adding Translations:**

Edit the `translations` object in `script.js`:

```javascript
const translations = {
    pt: {
        your_key: 'Seu texto em português'
    },
    en: {
        your_key: 'Your text in English'
    }
};
```

Then use in HTML: `<span data-i18n="your_key">Default text</span>`

### 📱 Responsive Breakpoints

- **Mobile**: < 768px (1 column, hamburger menu)
- **Tablet**: 768px - 1024px (2 columns, adjusted fonts)
- **Desktop**: > 1024px (3 columns, full experience)

### ⚠️ Disclaimer

**IMPORTANT**: This is an educational platform. Cryptocurrency trading involves significant risk. Always do your own research (DYOR) and never invest more than you can afford to lose.

### 📄 License

Free to use for educational purposes. Not for commercial redistribution without permission.

### 🤝 Contributing

This is a standalone educational project. Feel free to fork and customize for your own learning purposes.

---

## 🇧🇷 Português

### 🎯 Funcionalidades

- **🟢 Safe Signals**: Sinais baseados em análise técnica sólida (RSI, MACD, EMA, Bollinger Bands, Volume)
- **🔥 Degen Zone**: Oportunidades de alto risco incluindo:
  - Novas listagens (detecção precoce)
  - Rastreamento de memecoins
  - Alertas de movimentação de baleias
  - Oportunidades de arbitragem
- **📈 Simulador de Backtesting**: Teste estratégias de trading com dados históricos
- **⚡ Atualizações em Tempo Real**: Preços ao vivo e pontuação de sinais
- **🌐 Multi-Idioma**: Suporte completo para Português e Inglês
- **📱 Totalmente Responsivo**: Experiência perfeita em mobile, tablet e desktop
- **🎨 UI Moderna**: Tema roxo/preto com animações e efeitos suaves

### 🚀 Início Rápido

1. **Clone ou baixe** o projeto
2. **Abra `index.html`** em qualquer navegador moderno
3. **Pronto!** Não requer processo de build ou dependências

```bash
# Opção 1: Abrir diretamente
open index.html  # macOS
start index.html  # Windows
xdg-open index.html  # Linux

# Opção 2: Usar servidor local (recomendado)
python -m http.server 8000
# Depois visite http://localhost:8000

# Opção 3: Usando Node.js
npx http-server -p 8000
```

### 📁 Estrutura do Projeto

```
SignalDegen/
├── index.html          # Estrutura HTML principal
├── styles.css          # Todos os estilos (tema roxo/preto)
├── script.js           # JavaScript (sistema de idiomas, animações, interações)
└── README.md           # Documentação (este arquivo)
```

### 🎨 Sistema de Design

**Paleta de Cores:**
- Fundo: `#0a0a0f` (primário), `#1a1a2e` (cards)
- Roxo: `#8b5cf6` (primário), `#a78bfa` (secundário), `#c084fc` (destaques), `#6d28d9` (hover)
- Sinais: Verde (`#10b981` compra), Vermelho (`#ef4444` venda), Laranja (`#f59e0b` aguardar)

**Tipografia:**
- Primária: Inter (Google Fonts)
- Monoespaçada: JetBrains Mono (para números/preços)

**Efeitos:**
- Hover em cards: elevação + brilho roxo
- Gradiente animado no hero
- Animações de pulso nos badges de score
- Transições suaves (0.3s ease)

### 🌐 Sistema de Idiomas

A plataforma suporta **Português (PT-BR)** e **Inglês (EN)**.

- Clique nos botões de bandeira (🇧🇷 ou 🇺🇸) no cabeçalho para alternar
- Preferência de idioma salva no localStorage
- Idioma padrão: Português
- Notificação toast confirma mudança de idioma

**Para Desenvolvedores:**

```javascript
// Mudar idioma programaticamente
SignalDegen.changeLang('pt');  // ou 'en'

// Obter tradução
SignalDegen.t('hero.subtitle');  // Retorna texto traduzido

// Mostrar notificação toast
SignalDegen.showToast('Mensagem personalizada');
```

### 📊 Tipos de Sinais

**Safe Signals:**
- COMPRA FORTE (Score 80+)
- COMPRA (Score 60-79)
- AGUARDAR (Score 40-59)
- VENDA (Score <40)

**Degen Zone:**
- Níveis de risco: EXTREMO, MUITO ALTO, MÉDIO, BAIXO
- Categorias: Novas Listagens, Memecoins, Alertas de Baleias, Arbitragem

### 🛠️ Personalização

**Adicionando Novos Sinais:**

Edite o HTML em `index.html` para adicionar mais cards de sinais. Copie a estrutura:

```html
<div class="signal-card">
    <div class="card-header">
        <h3 class="pair">SEU_PAR/USDT</h3>
        <div class="score-badge pulse">
            <span class="score-label" data-i18n="common.score">Score</span>
            <span class="score-value">75</span>
        </div>
    </div>
    <!-- ... resto do card -->
</div>
```

**Adicionando Traduções:**

Edite o objeto `translations` em `script.js`:

```javascript
const translations = {
    pt: {
        sua_chave: 'Seu texto em português'
    },
    en: {
        sua_chave: 'Your text in English'
    }
};
```

Depois use no HTML: `<span data-i18n="sua_chave">Texto padrão</span>`

### 📱 Breakpoints Responsivos

- **Mobile**: < 768px (1 coluna, menu hamburger)
- **Tablet**: 768px - 1024px (2 colunas, fontes ajustadas)
- **Desktop**: > 1024px (3 colunas, experiência completa)

### ⚠️ Aviso Legal

**IMPORTANTE**: Esta é uma plataforma educacional. Trading de criptomoedas envolve risco significativo. Sempre faça sua própria pesquisa (DYOR) e nunca invista mais do que pode perder.

### 📄 Licença

Livre para uso educacional. Não redistribuir comercialmente sem permissão.

### 🤝 Contribuindo

Este é um projeto educacional independente. Sinta-se livre para fazer fork e personalizar para fins de aprendizado.

---

## 📞 Contact / Contato

**Project Type**: Educational Platform / Plataforma Educacional
**Year**: 2025
**Version**: 1.0.0

---

## 🔧 Technical Details / Detalhes Técnicos

### Technologies / Tecnologias

- **HTML5**: Semantic structure / Estrutura semântica
- **CSS3**: Flexbox, Grid, Animations / Flexbox, Grid, Animações
- **Vanilla JavaScript**: ES6+, LocalStorage, IntersectionObserver
- **Google Fonts**: Inter, JetBrains Mono

### Browser Support / Suporte de Navegadores

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Performance / Performance

- **No dependencies**: Zero external libraries (except Google Fonts)
- **Lightweight**: < 100KB total (HTML + CSS + JS)
- **Fast loading**: No build process or bundling required
- **Optimized animations**: Hardware-accelerated transforms

---

## 🎓 Learning Resources / Recursos de Aprendizado

This project demonstrates:
- **Responsive Web Design**: Mobile-first approach
- **CSS Grid & Flexbox**: Modern layouts
- **JavaScript DOM Manipulation**: Vanilla JS patterns
- **Internationalization (i18n)**: Multi-language support
- **LocalStorage API**: Persistent user preferences
- **Intersection Observer API**: Scroll animations

Este projeto demonstra:
- **Design Web Responsivo**: Abordagem mobile-first
- **CSS Grid & Flexbox**: Layouts modernos
- **Manipulação de DOM com JavaScript**: Padrões Vanilla JS
- **Internacionalização (i18n)**: Suporte multi-idioma
- **API LocalStorage**: Preferências persistentes do usuário
- **API Intersection Observer**: Animações de scroll

---

**Built with 💜 for the crypto community** | **Feito com 💜 para a comunidade cripto**
