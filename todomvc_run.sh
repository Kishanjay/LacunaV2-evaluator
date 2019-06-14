# node todomvc_instrumenter.js
# node todomvc_instrumentation_server.js
# gulp test-server
# npm run test
counter=0
while [ $counter -le 42 ]
do
node --max-old-space-size=8192 todomvc_lacuna.js --skipDynamic -o $counter > ./logs/$counter.log
((counter++))
done
# node todomvc_lacuna.js -o 10
# node todomvc_getstatistics