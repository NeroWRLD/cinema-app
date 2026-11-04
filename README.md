# Cinema — app de PC

Assista e compartilhe a tela com os amigos: https://cinema-juntos.vercel.app

## Baixar (Windows)
Vá em **[Releases](../../releases/latest)** e baixe `Cinema-Portatil-x.x.x.exe`. Não precisa instalar: é só abrir.

> O Windows pode mostrar **"Windows protegeu o computador"** porque o app não tem assinatura digital paga.
> Clique em **Mais informações → Executar assim mesmo**.

## Baixar (Linux)
Na mesma página de **[Releases](../../releases/latest)**:
- **Mint / Ubuntu / Debian:** baixe `cinema_x.x.x_amd64.deb` e dê dois cliques pra instalar. O Cinema aparece no menu.
- **Qualquer Linux:** baixe `Cinema-x.x.x.AppImage`, clique com o botão direito → Propriedades → Permissões → *Permitir executar como programa*, e abra.

> No Linux o app compartilha a imagem, mas não o som do PC (limite do sistema).

## Como funciona
- Abre o site do Cinema numa janela própria, então atualiza sozinho.
- Tem um seletor de tela próprio (tela inteira ou janela).
- No Windows manda o som do PC inteiro.

## Gerar de novo
```
npm install
npm start                                 # abrir em modo de teste
npx electron-builder --win portable zip   # Windows → dist/
npx electron-builder --linux              # Linux (AppImage + .deb) → dist/
```
