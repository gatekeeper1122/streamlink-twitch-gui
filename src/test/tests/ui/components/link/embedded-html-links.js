import { module, test } from "qunit";
import { setupRenderingTest } from "ember-qunit";
import { buildResolver, triggerEventSync } from "test-utils";
import { render } from "@ember/test-helpers";
import hbs from "htmlbars-inline-precompile";
import sinon from "sinon";

import Service from "@ember/service";

import embeddedHtmlLinksComponentInjector
	from "inject-loader?-utils/getStreamFromUrl!ui/components/link/embedded-html-links/component";


module( "ui/components/link/embedded-html-links", function( hooks ) {
	setupRenderingTest( hooks, {
		resolver: buildResolver()
	});

	hooks.beforeEach(function() {
		this.clipboardSetStub = sinon.stub();
		this.openBrowserStub = sinon.stub();
		this.contextMenuStub = sinon.stub();
		this.transitionToStub = sinon.stub();

		const { default: EmbeddedHtmlLinksComponent } = embeddedHtmlLinksComponentInjector({
			"nwjs/Clipboard": {
				set: this.clipboardSetStub
			},
			"nwjs/Shell": {
				openBrowser: this.openBrowserStub
			}
		});
		const NwjsService = Service.extend({
			contextMenu: this.contextMenuStub
		});
		const RoutingService = Service.extend({
			transitionTo: this.transitionToStub
		});

		this.owner.register( "component:embedded-html-links", EmbeddedHtmlLinksComponent );
		this.owner.register( "service:nwjs", NwjsService );
		this.owner.register( "service:-routing", RoutingService );
	});


	test( "EmbeddedHtmlLinksComponent", async function( assert ) {
		let event;

		await render( hbs`
			{{~#embedded-html-links~}}
				<a href="https://twitch.tv/foo">foo</a><br>
				<a href="https://bar.com/">bar.com</a>
			{{~/embedded-html-links~}}
		` );

		const [ anchorOne, anchorTwo ] = this.element.querySelectorAll( "a" );

		assert.notOk(
			anchorOne.classList.contains( "external-link" ),
			"First link is not external"
		);
		assert.strictEqual(
			anchorOne.title,
			"",
			"First link doesn't have a title property"
		);
		assert.ok(
			anchorTwo.classList.contains( "external-link" ),
			"Second link is external"
		);
		assert.strictEqual(
			anchorTwo.title,
			"https://bar.com/",
			"Second link has a title property"
		);

		// anchor 1
		// trigger mouseup events
		// left click
		event = triggerEventSync( anchorOne, "mouseup", { button: 0 } );
		assert.ok( event.isDefaultPrevented(), "Left click: default event is prevented" );
		assert.ok( event.isImmediatePropagationStopped(), "Left click: event doesn't propagate" );
		assert.propEqual(
			this.transitionToStub.args,
			[ [ "channel", "foo" ] ],
			"Opens channel page"
		);
		assert.notOk( this.openBrowserStub.called, "Doesn't open browser" );
		this.transitionToStub.resetHistory();
		// middle click (doesn't execute transition)
		event = triggerEventSync( anchorOne, "mouseup", { button: 1 } );
		assert.notOk( event.isDefaultPrevented(), "Middle click: default event is not prevented" );
		assert.notOk( event.isImmediatePropagationStopped(), "Middle click: event does propagate" );
		assert.notOk( this.transitionToStub.called, "Doesn't open channel page on non-left-click" );
		assert.notOk( this.openBrowserStub.called, "Doesn't open browser" );
		// right click (doesn't execute transition)
		event = triggerEventSync( anchorOne, "mouseup", { button: 2 } );
		assert.notOk( event.isDefaultPrevented(), "Right click: default event is not prevented" );
		assert.notOk( event.isImmediatePropagationStopped(), "Right click: event does propagate" );
		assert.notOk( this.transitionToStub.called, "Doesn't open channel page on non-left-click" );
		assert.notOk( this.openBrowserStub.called, "Doesn't open browser" );
		// doesn't have a context menu
		event = triggerEventSync( anchorOne, "contextmenu" );
		assert.notOk( event.isDefaultPrevented(), "Contextmenu: default event is not prevented" );
		assert.notOk( event.isImmediatePropagationStopped(), "Contextmenu: event does propagate" );
		assert.notOk( this.transitionToStub.called, "Doesn't open channel page on contextmenu" );
		assert.notOk( this.openBrowserStub.called, "Doesn't open browser" );
		assert.notOk( this.contextMenuStub.called, "Doesn't open context menu" );

		// anchor 2
		// trigger mouseup events
		// left click
		event = triggerEventSync( anchorTwo, "mouseup", { button: 0 } );
		assert.ok( event.isDefaultPrevented(), "Left click: default event is prevented" );
		assert.ok( event.isImmediatePropagationStopped(), "Left click: event doesn't propagate" );
		assert.notOk( this.transitionToStub.called, "Doesn't transition to different route" );
		assert.propEqual( this.openBrowserStub.args, [ [ "https://bar.com/" ] ], "Opens browser" );
		this.openBrowserStub.resetHistory();
		// middle click
		event = triggerEventSync( anchorTwo, "mouseup", { button: 1 } );
		assert.ok( event.isDefaultPrevented(), "Middle click: default event is prevented" );
		assert.ok( event.isImmediatePropagationStopped(), "Middle click: event doesn't propagate" );
		assert.notOk( this.transitionToStub.called, "Doesn't transition to different route" );
		assert.propEqual( this.openBrowserStub.args, [ [ "https://bar.com/" ] ], "Opens browser" );
		this.openBrowserStub.resetHistory();
		// right click (doesn't execute callback)
		event = triggerEventSync( anchorTwo, "mouseup", { button: 2 } );
		assert.notOk( event.isDefaultPrevented(), "Right click: default event is not prevented" );
		assert.notOk( event.isImmediatePropagationStopped(), "Right click: event does propagate" );
		assert.notOk( this.transitionToStub.called, "Doesn't transition to different route" );
		assert.notOk( this.openBrowserStub.called, "Doesn't open browser" );
		// has a context menu
		event = triggerEventSync( anchorTwo, "contextmenu" );
		assert.ok( event.isDefaultPrevented(), "Contextmenu: default event action is prevented" );
		assert.ok( event.isImmediatePropagationStopped(), "Contextmenu: event doesn't propagate" );
		assert.notOk( this.transitionToStub.called, "Doesn't transition to different route" );
		assert.notOk( this.openBrowserStub.called, "Doesn't open browser" );
		assert.propEqual( this.contextMenuStub.args, [ [
			event,
			[
				{
					label: [ "contextmenu.open-in-browser" ],
					click() {}
				},
				{
					label: [ "contextmenu.copy-link-address" ],
					click() {}
				}
			]
		] ], "Opens context menu" );

		assert.notOk( this.openBrowserStub.called, "Browser hasn't been opened yet" );
		assert.notOk( this.clipboardSetStub.called, "Set clipboard hasn't been called yet" );

		this.contextMenuStub.args[0][1][0].click();
		assert.propEqual( this.openBrowserStub.args, [ [ "https://bar.com/" ] ], "Opens browser" );

		this.contextMenuStub.args[0][1][1].click();
		assert.propEqual( this.clipboardSetStub.args, [ [ "https://bar.com/" ] ], "Sets clipboard" );

		// disabled events
		"mousedown click dblclick keyup keydown keypress"
			.split( " " )
			.forEach( name => {
				const eventOne = triggerEventSync( anchorOne, name );
				assert.notOk(
					eventOne.isDefaultPrevented(),
					`First link: default ${name} action is not prevented`
				);
				const eventTwo = triggerEventSync( anchorTwo, name );
				assert.ok(
					eventTwo.isDefaultPrevented(),
					`Second link: default ${name} action is prevented`
				);
			});
	});

});
