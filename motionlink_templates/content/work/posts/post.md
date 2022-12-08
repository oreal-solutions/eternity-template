---
weight: {{otherData.weight}}
images:
{{#otherData.images}}
- {{{.}}}
{{/otherData.images}}
title: "{{otherData.title}}"
date: "{{{otherData.date}}}"
tags:
{{#otherData.tags}}
- "{{{.}}}"
{{/otherData.tags}}
---

{{{otherData.markdown}}}
