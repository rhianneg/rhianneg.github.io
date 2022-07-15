---
title: Home
layout: PageLayout
colors: colors-a
backgroundImage:
  backgroundSize: cover
  backgroundPosition: center
  backgroundRepeat: no-repeat
  opacity: 75
sections:
  - elementId: ''
    colors: colors-f
    backgroundSize: full
    title: 'Hello, I’m Rhianne Gonsalves'
    subtitle: 'A Data Enthusiast, Automation Developer, Runner, and Creative.'
    styles:
      self:
        height: auto
        width: wide
        margin:
          - mt-0
          - mb-0
          - ml-0
          - mr-0
        padding:
          - pt-36
          - pb-48
          - pl-4
          - pr-4
        alignItems: center
        justifyContent: center
        flexDirection: row-reverse
      title:
        textAlign: left
      subtitle:
        textAlign: left
      text:
        textAlign: left
      actions:
        justifyContent: flex-start
    type: HeroSection
    actions:
      - type: Button
        label: My Projects
        altText: ''
        url: /
        showIcon: false
        icon: arrowRight
        iconPosition: right
        style: primary
        elementId: ''
      - type: Button
        altText: ''
        url: /www.linkedin.com/in/rhianne-gonsalves
        showIcon: true
        icon: linkedin
        iconPosition: right
        style: primary
        elementId: ''
    text: >
      Having worked in fast paced environments at Deloitte Consulting and a
      startup has taught me to quickly adapt and always be open to learning. I
      like learning new skills and using them to build solutions that help solve
      business problems. I also believe in using my programming skills to build
      automation that helps me and my team perform better.
  - colors: colors-f
    type: FeaturedProjectsSection
    elementId: ''
    actions:
      - type: Link
        label: See all projects
        url: /projects
    showDate: false
    showDescription: true
    showFeaturedImage: true
    showReadMoreLink: true
    variant: variant-b
    projects:
      - content/pages/projects/project-two.md
      - content/pages/projects/project-three.md
      - content/pages/projects/project-one.md
    styles:
      self:
        height: auto
        width: wide
        margin:
          - mt-0
          - mb-0
          - ml-0
          - mr-0
        padding:
          - pt-24
          - pb-24
          - pl-4
          - pr-4
        justifyContent: center
      title:
        textAlign: left
      subtitle:
        textAlign: left
      actions:
        justifyContent: flex-end
    subtitle: 'Projects:'
---
