import type{MetadataRoute}from'next';export default function sitemap():MetadataRoute.Sitemap{return['','/viilife','/viiconcierge','/shop'].map(p=>({url:`https://viicasa.com${p}`}));}
