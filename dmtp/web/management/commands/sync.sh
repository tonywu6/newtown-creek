#!/usr/local/bin/zsh

rsync -avzP --include='*.html' \
    --include=article/ --include='article/**' \
    --include=static/ \
    --include=static/gql.json \
    --exclude='static/**' \
    . $1 --delete --delete-excluded \
    --rsync-path="sudo rsync"
