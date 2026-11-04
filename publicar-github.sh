#!/bin/bash
# Cria o repositório público "cinema-app" no GitHub (se ainda não existir) e publica a versão atual do app.
set -e
cd "$(dirname "$0")"
V=$(node -p 'require("./package.json").version')
gh repo view cinema-app >/dev/null 2>&1 || gh repo create cinema-app --public --description "Cinema — app de PC pra assistir e compartilhar a tela com os amigos" --source . --push
git push -q origin main
gh release create "v$V" "dist/Cinema-Portatil-$V.exe" "dist/Cinema-$V-win-x64.zip" --title "Cinema $V" --notes "Baixe **Cinema-Portatil-$V.exe** e abra. Não precisa instalar.

Se o Windows mostrar *\"Windows protegeu o computador\"*, clique em **Mais informações → Executar assim mesmo** (o app não tem assinatura digital paga)."
echo "Pronto! Link pra mandar pros amigos:"
echo "https://github.com/$(gh api user -q .login)/cinema-app/releases/latest"
