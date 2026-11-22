<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>
<xsl:template match="/rss/channel">
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>RSS · <xsl:value-of select="title"/></title>
<link rel="stylesheet" href="../assets/fonts.css"/>
<style>
body{margin:0;background:#f6f4ee;color:#1d1c1a;font-family:"Source Serif 4",Georgia,serif;font-size:18px;line-height:1.55}
main{max-width:44rem;margin:0 auto;padding:56px 24px 80px}
.k{font-family:"IBM Plex Mono",monospace;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:#6d6a63;margin:0 0 14px}
h1{font-weight:400;font-size:34px;line-height:1.15;margin:0 0 12px}
.box{font-family:"IBM Plex Mono",monospace;font-size:13px;border:1px dashed #7b2b23;color:#7b2b23;background:rgba(123,43,35,.05);padding:12px 14px;margin:22px 0 36px}
.box code{user-select:all;background:#fff;padding:1px 5px;border:1px solid #d9d4c7;color:#1d1c1a}
ol{list-style:none;margin:0;padding:0}
li{border-top:1px solid #d9d4c7;padding:20px 0}
li .m{font-family:"IBM Plex Mono",monospace;font-size:12px;color:#6d6a63}
li a{color:#1d1c1a;text-decoration:none;border-bottom:1px solid #d9d4c7;font-size:21px}
li a:hover{color:#7b2b23;border-color:#7b2b23}
li p{margin:6px 0 0;color:#3a3833}
.back{font-family:"IBM Plex Mono",monospace;font-size:13px;color:#7b2b23}
</style></head>
<body><main>
<p class="k">RSS feed</p>
<h1><xsl:value-of select="title"/></h1>
<p><xsl:value-of select="description"/></p>
<div class="box">This page is a feed, meant for a reader app. Paste this address into Feedly, NetNewsWire, Inoreader or any RSS reader to get each new proposal and sequel:<br/><br/><code>https://sohanhajra.github.io/writing/feed.xml</code></div>
<ol>
<xsl:for-each select="item">
<li><span class="m"><xsl:value-of select="category"/> · <xsl:value-of select="substring(pubDate,6,11)"/></span><br/>
<a href="{link}"><xsl:value-of select="title"/></a>
<p><xsl:value-of select="description"/></p></li>
</xsl:for-each>
</ol>
<p><a class="back" href="../index.html#writing">← Back to Writing</a></p>
</main></body></html>
</xsl:template>
</xsl:stylesheet>
