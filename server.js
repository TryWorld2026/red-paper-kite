const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname;
const MIME={'.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.js':'text/javascript;charset=utf-8','.json':'application/json;charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg'};
http.createServer((req,res)=>{
  let url=req.url.split('?')[0];
  if(url==='/') url='/index.html';
  const fp=path.join(ROOT,url);
  if(!fp.startsWith(ROOT)){res.writeHead(403);res.end('Forbidden');return;}
  fs.readFile(fp,(err,data)=>{
    if(err){res.writeHead(404);res.end('Not Found: '+url);return;}
    const ext=path.extname(fp).toLowerCase();
    res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream'});
    res.end(data);
  });
}).listen(8080,()=>console.log('Server running at http://localhost:8080'));
