// AdminPanel

module.exports = Backbone.View.extend({
	id: 'AdminPanel',
	className: 'container',
	template: _.template(`
		<div class="settings panel panel-default">
			<div class="panel-heading" data-toggle="collapse" data-target=".settings .panel-collapse">
				<div class="panel-title">
					Site Settings:
				</div>
			</div>
			<div class="panel-collapse collapse">
				<div class="panel-body">
					<table>
						<form class="public">
							<tr rv-each-attr="settings.attributes |to_a">
								<td rv-text="attr.key"></td>
								<td>
									<input rv-value="attr.value">
								</td>
							</tr>
						</form>
						<form class="private">
							<tr rv-each-attr="privateSettings.attributes |to_a">
								<td rv-text="attr.key"></td>
								<td>
									<input rv-value="attr.value">
								</td>
							</tr>
						</form>
					</table>
				</div>
				<div class="panel-footer">
					<input type="submit" value="Update" class="update btn btn-light">
					<div class="error" rv-text="settingsError"></div>
				</div>
			</div>
		</div>

		<div class="doors panel panel-default">
			<div class="panel-heading" data-toggle="collapse" data-target=".doors .panel-collapse">
				<div class="panel-title">
					Doors:
					<a class="toggle new fa fa-plus"></a>
				</div>
			</div>
			<div class="panel-collapse collapse show">
				<div class="panel-body">
					<form rv-show="creatingDoor" >
						<input type="text" name="name" placeholder="Name" required>
						<input type="submit" class="new btn btn-light" value="Create">
						<div class="error" rv-text="doorError"></div>
					</form>
					<div rv-each-door="doors">
						<span rv-text="door:id"></span>.
						<a rv-href="'#/door/' |+ door:id" rv-text="door:name"></a>
						<span rv-hide="door:available" rv-text="door:token"></span>
						<span rv-show="door:available" class="fa fa-check-circle"></span>
					</div>
				</div>
			</div>
		</div>

		<div class="invites panel panel-default">
			<div class="panel-heading" data-toggle="collapse" data-target=".invites .panel-collapse">
				<div class="panel-title">
					Invites:
					<a class="toggle new fa fa-plus"></a>
				</div>
			</div>
			<div class="panel-collapse collapse" rv-class-in="showInvites">
				<div class="panel-body">
					<form rv-show="creatingInvite" >
						#TODO: edit invite permissions
						<div class="error" rv-text="inviteError"></div>
					</form>
					<ol>
						<% for (const invite of invites && invites.models || []) { %>
							<li>
								<span><%- invite.get('admin_username') %></span>
								<span><%- lux(invite.get('date'), 'DATETIME_SHORT') %></span>
								<span><%- invite.get('token', '').slice(0, 8) %></span>
								<a target="_blank"
									rv-href="inviteMailto |+ invite:token">
									[Send Email]
								</a>
							</li>
						<% } %>
					</ol>
				</div>
			</div>
		</div>

		<div class="users panel panel-default">
			<div class="panel-heading" data-toggle="collapse" data-target=".users .panel-collapse">
				<div class="panel-title">
					Users:
					<a class="toggle new fa fa-plus"></a>
				</div>
			</div>

			<div class="panel-collapse collapse show">
				<div class="panel-body">
					<form rv-show="creatingUser">
						<input type="text" name="name" placeholder="Name" required>
						<input type="submit" class="new btn btn-light" value="Create">
						<div class="error" rv-text="userError"></div>
					</form>
					<div rv-each-user="users">
						<a rv-href="'#user/' |+ user:username" rv-text="user:username"></a>
						<span rv-text="user:password"></span>
						<span rv-text="user.doors"></span>
						<a rv-show="user:password |and user:id |gt 1" target="_blank"
							rv-href="mailto |+ user:username |+ ' ' |+ user:password |+ mail2">
							[Send Email]
						</a>
					</div>
				</div>
			</div>
		</div>
	`),
	events: {
		'click .doors .new': 'createDoor',
		'click .users .new': 'createUser',
		'click .invites .new': 'createInvite',
		'click .settings .update': 'updateSettings',
	},
	initialize: function() {
		if (!App.User.get('admin')) {
			// console.log("NOT ADMIN!!");
			return App.Router.navigate('', {trigger: true});
		}

		this.doors = new (Backbone.Collection.extend({
			url: '/api/v1/doors',
		}))();
		this.doors.on('sync', _.bind(function() {
			if (this.users) {
				this.users.fetch();
			}
			//TODO: render should not be nessicary
			this.render();
		}, this));
		this.doors.fetch();

		this.users = new (Backbone.Collection.extend({
			url: '/api/v1/users',
		}))();
		this.users.on('sync', _.bind(function(coll) {
			// Turn door numbers into names
			if (coll.each)
				coll.each(_.bind(function(user) {
					user.doors = _.map(user.get('doors'), _.bind(function(d) {
						return this.doors.findWhere({id: d.id}).get('name');
					}, this));
				}, this));
			//TODO: render should not be nessicary
			this.render();
		}, this));

		this.privateSettings = new (Backbone.Model.extend({
			url: '/api/v1/site/private_settings',
		}))();
		this.privateSettings.fetch({success: _.bind(function() {
			this.render();
		}, this)});

		this.invites = new (Backbone.Collection.extend({
			url: '/api/v1/site/invites',
		}))();
		this.invites.on('sync', () => {
			this.render();
		});
		this.invites.fetch();
	},
	render: function() {
		// console.log("RENDER MAIN:", App.User.get('admin'))
		Object.assign(this, {
			// doors: this.doors,
			// users: this.users,
			invites: this.invites, // TODO: WTF
			settings: App.Settings,
			privateSettings: this.privateSettings,
			mailto: "mailto:?subject=Portalbot&body=Hey! you've been setup on the door. Visit " +
				window.location.toString().replace(window.location.hash, '') +
				' and sign-in with the username and password:%0D%0A%0D%0A',
			mail2: "   (case-sensitive)%0D%0A%0D%0ADon't forget to update your password =]",
			inviteMailto: "mailto:?subject=Doorbot&body=Hey! you've been invited to Doorbot," +
				' click here to create a user: ' +
				window.location.toString().replace(window.location.hash, '') + '#token/',
		});
		this.$el.html(this.template(this));
		return this;
	},
	createDoor: function(e) {
		if (e) {
			e.preventDefault();
			if (this.$('.doors .panel-collapse.show').length) {
				e.stopPropagation();
			} else if (this.scope.creatingDoor) {
				//TODO: delayFocus?
				setTimeout(_.bind(function() {
					this.$('.doors input[name]').focus();
				}, this));
				return;
			}
		}

		if (this.$(e.currentTarget).hasClass('toggle')) {
			this.scope.creatingDoor = !this.scope.creatingDoor;
			this.scope.doorError = undefined;
			if (this.scope.creatingDoor) {
				setTimeout(_.bind(function() {
					this.$('.doors input[name]').focus();
				}, this));
			}
		} else {
			// console.log('CREEATING DOOR');
			this.doors.create({
				name: this.$('.doors form [name="name"]').val(),
			}, {wait: true,
				success: _.bind(function() {
					console.log('DOOR CREATE DONE!', this.doors);
					this.scope.creatingDoor = false;
				}, this),
				error: _.bind(function(m, resp) {
					console.warn('DOOR CREATE ERR!', resp.responseText);
					this.scope.doorError = resp.responseText;
				}, this),
			});
		}
	},
	//TODO: door_panel
	// editDoor: function(e) {
	// 	var id = $(e.currentTarget).data('id');
	// 	if (!this.scope.editingDoor) {
	// 		this.scope.editingDoor = id;
	// 		self.scope.error = undefined;
	// 	} else {
	// 		var door = this.doors.find({id: id});
	// 		// door.sync(null, this, {url: door.url()+'/open', method: 'PO
	// 	}
	// },
	// deleteDoor: function(e) {
	// 	this.doors.find({id: this.$(e.currentTarget).data('id')}).destroy();
	// },
	createInvite: function(e) {
		// if (e) {
		// 	e.preventDefault();
		// 	if (this.$('.invites .panel-collapse.in').length) {
		// 		e.stopPropagation();
		// 	} else if (this.scope.creatingInvite) {
		// 		//TODO: delayFocus?
		// 		setTimeout(_.bind(function() {
		// 			this.$('.invites input[name]').focus();
		// 		}, this));
		// 		return;
		// 	}
		// }

		// if (this.$(e.currentTarget).hasClass('toggle')) {
		// 	this.scope.creatingInvite = !this.scope.creatingUser;
		// 	this.scope.inviteError = undefined;
		// 	if (this.scope.creatingInvite) {
		// 		setTimeout(_.bind(function() {
		// 			this.$('.invites input[name]').focus();
		// 		}, this));
		// 	}
		// } else {
		this.invites.create({
			permissions: this.$('.invites form [name="permissions"]').val(),
		}, {wait: true,
			success: _.bind(function() {
				console.log('INVITE CREATE DONE!', this.doors);
				this.scope.showInvites = true;
				this.scope.creatingInvite = false;
			}, this),
			error: _.bind(function(m, resp) {
				console.warn('INVITE CREATE ERR!', resp.responseText);
				this.scope.inviteError = resp.responseText;
			}, this),
		});
		// }
	},
	createUser: function(e) {
		if (e) {
			e.preventDefault();
			if (this.$('.users .panel-collapse.show').length) {
				e.stopPropagation();
			} else if (this.scope.creatingUser) {
				//TODO: delayFocus?
				setTimeout(_.bind(function() {
					this.$('.users input[name]').focus();
				}, this));
				return;
			}
		}

		if (this.$(e.currentTarget).hasClass('toggle')) {
			this.scope.creatingUser = !this.scope.creatingUser;
			this.scope.userError = undefined;
			if (this.scope.creatingUser) {
				setTimeout(_.bind(function() {
					this.$('.users input[name]').focus();
				}, this));
			}
		} else {
			this.users.create({
				username: this.$('.users form [name="name"]').val(),
			}, {wait: true,
				success: _.bind(function(m) {
					console.log('USER CREATE DONE!', arguments);
					this.scope.creatingUser = false;
					App.Router.navigate('/user/'+m.get('username'),
						{trigger: true});
				}, this),
				error: _.bind(function(m, resp) {
					console.warn('USER CREATE ERR!', resp.responseText);
					this.scope.userError = resp.responseText;
				}, this),
			});
		}
	},
	updateSettings: function() {
		const publicSettings = this.$('.settings form.public');
		const privateSettings = this.$('.settings form.private');

		//TODO:
		console.log('publicSettings', publicSettings);
		console.log('privateSettings', privateSettings);
	},
});
