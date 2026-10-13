/** Local visual QA: public API reads only. Every mutation and authenticated read is blocked. */
import http from 'node:http';
const appOrigin = 'http://127.0.0.1:5080';
const publicOrigin = 'https://biblechorus.com';
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, appOrigin);
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405,{'content-type':'application/json'}); res.end(JSON.stringify({message:'Read-only preview: changes are disabled'})); return; }
  if (url.pathname.startsWith('/api/auth/')) { res.writeHead(401,{'content-type':'application/json'}); res.end(JSON.stringify({message:'Read-only preview'})); return; }
  const isApi = url.pathname.startsWith('/api/');
  const target = new URL(url.pathname+url.search,isApi ? publicOrigin : appOrigin);
  try {
    const upstream = await fetch(target,{method:req.method, headers: {accept:req.headers.accept || '*/*'}});
    const headers = {};
    for (const [key,value] of upstream.headers) if (!['content-encoding','content-length','set-cookie','transfer-encoding','connection'].includes(key)) headers[key] = value;
    if (isApi) headers['cache-control']='no-store';
    res.writeHead(upstream.status,headers); res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch { res.writeHead(502,{'content-type':'application/json'}); res.end(JSON.stringify({message:'Public preview data unavailable'})); }
});
server.listen(4100,'127.0.0.1',()=>console.log('Read-only visual preview: http://127.0.0.1:4100'));
