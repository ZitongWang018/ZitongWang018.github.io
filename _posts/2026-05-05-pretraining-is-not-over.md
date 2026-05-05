---
title: 'Pre-training Is Not Finished'
date: 2026-05-05
permalink: /posts/20260505-pretraining-thought/
categories:
  - thought
tags:
  - LLM
---

I believe pre-training for large language models is far from done.

Many recent lines of work stress agent-style engineering and post-training. These can give clear gains on fixed tasks. Still, the abilities that matter most—taking in the world as it is and working with rich, messy reality—rest on large-scale pre-training with strong data and on changes deep inside the model. That means better core designs (moving past today’s standard Transformer recipe where needed), memory that works more like useful recall than a fixed trick, and ways to merge signals when the input type shifts.

In multimodal settings and in vision–language–action stacks, strong ideas from LLMs can carry over to multimodal LLMs and to world models. If we get that hand-off right, we should see tighter alignment across modalities and more capable embodied systems—built on serious pre-training and architecture work, not only on thin layers on top.
