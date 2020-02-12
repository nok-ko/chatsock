### Tech Stack/Libraries:
* shim for nicer chaining?
* socket.io <3 cycle.js?
* enum message types? 
  * '9' is lighter than 'chat' is lighter than 'please-nick'

### Features
* nick collision
* ~~fix pleasenick bug~~
* put more things in grid 
  * nickname/text container
  * compose/send container
* sessions
  * remember thy nick
* message history
  * redis, memcached, JSON, whatever
* in-chat hyperlinks 
  * maybe embeds? 0.0
* private messages
* MoTD
* operator stuff?
* channels
* ratelimit(s)
  * text-per-message limit
  * anti-link?
  * /shrug
* `who` command/feature
* Twemoji!