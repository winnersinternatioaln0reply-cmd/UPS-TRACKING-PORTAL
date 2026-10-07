const SALT="tp2026CONFIDENTIAL ENVIRONMENT ";
const TICKET_HASH="3476b709faf2d41fd42e29f916d3428441fd9f8cd8f91cf8cfb147d2a1f2704e";
const CODE_HASH="f71d22024197b41333d51208ad85c334ea29e7ae3590a3a2b7a34a802765f939";
async function sha256(s){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");}
async function authenticate(t,c){const th=await sha256(t+SALT),ch=await sha256(c+SALT);return th===TICKET_HASH&&ch===CODE_HASH;}
