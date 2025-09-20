"use strict";(()=>{var t={};t.id=164,t.ids=[164,888,660],t.modules={8847:(t,e)=>{Object.defineProperty(e,"l",{enumerable:!0,get:function(){return function t(e,r){return r in e?e[r]:"then"in e&&"function"==typeof e.then?e.then(e=>t(e,r)):"function"==typeof e&&"default"===r?e:void 0}}})},3702:(t,e,r)=>{r.a(t,async(t,i)=>{try{r.r(e),r.d(e,{config:()=>f,default:()=>g,getServerSideProps:()=>d,getStaticPaths:()=>u,getStaticProps:()=>m,reportWebVitals:()=>h,routeModule:()=>w,unstable_getServerProps:()=>S,unstable_getServerSideProps:()=>j,unstable_getStaticParams:()=>P,unstable_getStaticPaths:()=>x,unstable_getStaticProps:()=>y});var n=r(9847),a=r(2603),o=r(8847),s=r(6840),l=r(8379),c=r(9042),p=t([l]);l=(p.then?(await p)():p)[0];let g=(0,o.l)(c,"default"),m=(0,o.l)(c,"getStaticProps"),u=(0,o.l)(c,"getStaticPaths"),d=(0,o.l)(c,"getServerSideProps"),f=(0,o.l)(c,"config"),h=(0,o.l)(c,"reportWebVitals"),y=(0,o.l)(c,"unstable_getStaticProps"),x=(0,o.l)(c,"unstable_getStaticPaths"),P=(0,o.l)(c,"unstable_getStaticParams"),S=(0,o.l)(c,"unstable_getServerProps"),j=(0,o.l)(c,"unstable_getServerSideProps"),w=new n.PagesRouteModule({definition:{kind:a.x.PAGES,page:"/sitemap.xml",pathname:"/sitemap.xml",bundlePath:"",filename:""},components:{App:l.default,Document:s.default},userland:c});i()}catch(t){i(t)}})},6840:(t,e,r)=>{r.r(e),r.d(e,{default:()=>a});var i=r(997),n=r(3590);function a(){return(0,i.jsxs)(n.Html,{lang:"en",children:[(0,i.jsxs)(n.Head,{children:[i.jsx("meta",{charSet:"utf-8"}),i.jsx("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}),i.jsx("link",{rel:"icon",type:"image/svg+xml",href:"/favicon.svg"}),i.jsx("link",{rel:"icon",type:"image/x-icon",href:"/favicon.ico"}),i.jsx("link",{rel:"apple-touch-icon",href:"/favicon.svg"}),i.jsx("link",{rel:"manifest",href:"/manifest.json"}),i.jsx("meta",{name:"robots",content:"index, follow"}),i.jsx("meta",{name:"googlebot",content:"index, follow"}),i.jsx("meta",{property:"og:type",content:"website"}),i.jsx("meta",{property:"og:url",content:"https://keralgiftsonline.in/"}),i.jsx("meta",{property:"og:title",content:"KeralGiftsOnline - Premium Gifts & Traditional Products"}),i.jsx("meta",{property:"og:description",content:"Discover premium quality gifts, traditional products, and authentic Kerala items. Fast delivery across Kerala with our advanced logistics network."}),i.jsx("meta",{property:"og:image",content:"https://keralgiftsonline.in/images/og-image.jpg"}),i.jsx("meta",{property:"og:site_name",content:"KeralGiftsOnline"}),i.jsx("meta",{property:"og:locale",content:"en_US"}),i.jsx("meta",{property:"twitter:card",content:"summary_large_image"}),i.jsx("meta",{property:"twitter:url",content:"https://keralgiftsonline.in/"}),i.jsx("meta",{property:"twitter:title",content:"KeralGiftsOnline - Premium Gifts & Traditional Products"}),i.jsx("meta",{property:"twitter:description",content:"Discover premium quality gifts, traditional products, and authentic Kerala items. Fast delivery across Kerala with our advanced logistics network."}),i.jsx("meta",{property:"twitter:image",content:"https://keralgiftsonline.in/images/og-image.jpg"}),i.jsx("meta",{name:"theme-color",content:"#dc2626"}),i.jsx("meta",{name:"msapplication-TileColor",content:"#dc2626"}),i.jsx("meta",{name:"application-name",content:"KeralGiftsOnline"}),i.jsx("link",{rel:"preconnect",href:"https://res.cloudinary.com"}),i.jsx("link",{rel:"dns-prefetch",href:"https://res.cloudinary.com"}),i.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),i.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous"}),i.jsx("script",{type:"application/ld+json",dangerouslySetInnerHTML:{__html:JSON.stringify({"@context":"https://schema.org","@type":"Organization",name:"KeralGiftsOnline",url:"https://keralgiftsonline.in",logo:"https://keralgiftsonline.in/favicon.svg",description:"Premium quality gifts, traditional products, and authentic Kerala items with fast delivery across Kerala",address:{"@type":"PostalAddress",addressCountry:"IN",addressRegion:"Kerala"},contactPoint:{"@type":"ContactPoint",contactType:"customer service",availableLanguage:["English","Malayalam"]},sameAs:["https://facebook.com/keralgiftsonline","https://instagram.com/keralgiftsonline"]})}})]}),(0,i.jsxs)("body",{children:[i.jsx(n.Main,{}),i.jsx(n.NextScript,{})]})]})}},9042:(t,e,r)=>{r.r(e),r.d(e,{default:()=>n,getServerSideProps:()=>i});let i=async({res:t})=>{let e=`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>https://keralgiftsonline.in/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Products Page -->
  <url>
    <loc>https://keralgiftsonline.in/products</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- About Page -->
  <url>
    <loc>https://keralgiftsonline.in/about</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Content Page -->
  <url>
    <loc>https://keralgiftsonline.in/content</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Login Page -->
  <url>
    <loc>https://keralgiftsonline.in/login</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Register Page -->
  <url>
    <loc>https://keralgiftsonline.in/register</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Cart Page -->
  <url>
    <loc>https://keralgiftsonline.in/cart</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- Wishlist Page -->
  <url>
    <loc>https://keralgiftsonline.in/wishlist</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- Orders Page -->
  <url>
    <loc>https://keralgiftsonline.in/orders</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Profile Page -->
  <url>
    <loc>https://keralgiftsonline.in/profile</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;return t.setHeader("Content-Type","text/xml"),t.setHeader("Cache-Control","public, max-age=3600, s-maxage=3600"),t.write(e),t.end(),{props:{}}},n=()=>null},2603:(t,e)=>{var r;Object.defineProperty(e,"x",{enumerable:!0,get:function(){return r}}),function(t){t.PAGES="PAGES",t.PAGES_API="PAGES_API",t.APP_PAGE="APP_PAGE",t.APP_ROUTE="APP_ROUTE"}(r||(r={}))},2785:t=>{t.exports=require("next/dist/compiled/next-server/pages.runtime.prod.js")},6689:t=>{t.exports=require("react")},6405:t=>{t.exports=require("react-dom")},997:t=>{t.exports=require("react/jsx-runtime")},2048:t=>{t.exports=require("fs")},5315:t=>{t.exports=require("path")},6162:t=>{t.exports=require("stream")},1568:t=>{t.exports=require("zlib")},9648:t=>{t.exports=import("axios")}};var e=require("../webpack-runtime.js");e.C(t);var r=t=>e(e.s=t),i=e.X(0,[417,827,590,379],()=>r(3702));module.exports=i})();