# Tumblr Salvager for Greasemonkey  
  (modified tumblr savior)

## What does it do?

I'll just quote the extension's original developer, Bjorn Stromberg:

"Tired of posts about the iPhone filling up your dashboard? Hate hearing about some athlete's latest blunders? If you just want to hide posts about certain topics, Tumblr Savior is here to save you. Just add your most despised terms to the black list and Tumblr Savior will valiantly protect your delicate sensibilities. And if you wonder what got hidden, there’s a handy link to show you."

## What's different from the original version?

Here's what's added in my fork from the "Savior" version of this userscript ([https://github.com/codeman38/tumblr-savior-gm](https://github.com/codeman38/tumblr-savior-gm)):

* (implemented) Tumblr Salvager offers you twice as much control over what posts you want to hide or see: in addition to the usual white and black lists it introduces two more: ultra white and infra black ones, that take precedence over the original ones. This way you can fine-tune your preferences and get rid of more annoying stuff while not missing something actually interesting.  
  For example, you can put tags describing certain categories of entities (like groups of people) into the common white and black lists, while having tags for singular objects (like person names) into the additional lists.

* (in development) Afraid you'll still hide too much and end up with a barren desert of a dashboard? Fear not, for Tumblr Salvager will fetch posts from the next page of the dashboard should it notice there are too few posts left in the current one. Less clicking, more content.

* (in development) Tired of seeing same posts being reblogged to and fro by your followees? Tumblr Salvager can hide reblogs of posts you have seen already, optionally counting the times you have seen them and only removing reblogs when enough is enough.


Here's what's different from the browser-extension version of Tumblr Savior ([binaries](http://bjornstar.com/tumblr-savior) / [source](https://github.com/bjornstar/Tumblr-Savior)):

* It's possible to include a logical 'and' operator by using an ampersand within a blacklist/whitelist string. (For instance, adding "george wendt&beans" to the blacklist will only block posts containing both "george wendt" and "beans".)  
  ^ this is the feature preserved from the [source](https://github.com/codeman38/tumblr-savior-gm) of this fork

* Keyboard navigation using the 'j' and 'k' keys is no longer broken when a post is hidden.

* A new option, 'hide_own_posts', has been added to the settings object; if set to true, this will cause the blacklist and whitelist to apply to posts that you've made as well as others' posts.

## Why use this version instead?

* Tumblr Savior might be useful when there are only a few unwanted posts in your dashboard compared to all the decent content. But when the balance is not in your favor, you'll need this userscript to salvage the few high-quality posts there might be.

* Because Greasemonkey scripts are even more universal than browser-specific extensions (and less finicky with API changes).

* Because the version bundled in the browser extension isn't lightweight *enough* for some people.

* Because the original can't do logical 'and' operations on keywords.

## How do I install it?

[Just follow this link right here!](tumblr-savior.user.js) Then be sure to modify the default settings of lists to fit your world view.
