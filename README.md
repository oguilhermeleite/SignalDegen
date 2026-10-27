# 📡 SignalDegen — Radar de Pools de Liquidez

Site: https://oguilhermeleite.github.io/SignalDegen/

Radar de pools de liquidez na Solana com dados reais, sem números inventados.

## O que tem

- **🔥 Pools Quentes**: volume 24h ≥ liquidez (giro ≥ 1x) e volume de hoje ≥ 1,5x a média de 7 dias. Ordenadas por APR 24h.
- **⚖️ Pools Moderadas**: liquidez > $1M, pool com mais de 30 dias, giro entre 0,1x e 1x, APR 24h até 40% diferente do APR 7d, par com SOL/stablecoin/LST.
- **⭐ Favoritas** com alertas (🔔) quando uma pool fica quente ou o APR cai pela metade.
- **🔍 Analisador**: qualquer pool (Solana, Ethereum, Base, Arbitrum, BSC). Mostra taxa real, APR diário/mensal/anual, objetivo da pool, 3 ranges sugeridos, gráfico de 7 dias com as faixas, **% do tempo que o preço ficou dentro de cada range**, montador de range próprio, botão "Ir para Pool" e cópia da análise no formato de texto.
- PT/EN pelas bandeiras.

## Fontes de dados

| Fonte | Uso |
|---|---|
| Raydium API v3 | Taxa real, TVL, volume 24h/7d, APR |
| Meteora DLMM API | Pools DLMM (taxa, liquidez, taxas 24h) |
| GeckoTerminal | Pools em alta, dados de qualquer pool, histórico de preço |
| DexScreener | Reserva caso o GeckoTerminal falhe |

Cada fonte é independente: se uma cair, o radar segue com as outras (os chips ✓/✕ mostram o status). Respostas ficam em cache por 5 min no navegador.

## Estrutura

```
index.html
styles.css
js/sources.js   # busca e normaliza dados das APIs
js/classify.js  # regras de Quentes/Moderadas, nota, risco, ranges
js/i18n.js      # textos PT/EN
js/app.js       # interface
```

Site estático (GitHub Pages), sem build.

⚠️ Conteúdo educacional, não é recomendação de investimento.
