#! /bin/bash
export PATH=~/.local/bin:$PATH
ssh jw2117@sinkhole.srcf.net -C "cd $PWD;export PATH=~/.local/bin:$PATH&&~/.local/bin/yarn prod"
