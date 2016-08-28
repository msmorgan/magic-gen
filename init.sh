npm install unidecode mkdirp lodash
curl -O https://mtgjson.com/json/AllSets-x.json
node gen-card-files.js
cat cards/*/* | fold -w1 | sort -u | tr -d '\r\n' >alphabet.txt
echo >>alphabet.txt

