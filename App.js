Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
        this._loadTemplatePreferences().then({
            success: this._bucketPrefsTogether,
            scope: this
        }).then({
            success: this._addGrid,
            scope: this
        });
    },

    _loadTemplatePreferences: function(model) {
        var filters = [
            {
                property: 'Name',
                operator: 'contains',
                value: 'rich-text-templates-'
            },
            Rally.data.wsapi.Filter.or([
                {
                    property: 'Workspace',
                    value: this.getContext().getWorkspaceRef()
                },
                {
                    property: 'Project',
                    value: this.getContext().getProjectRef()
                },
                {
                    property: 'User',
                    value: Rally.util.Ref.getRelativeUri(this.getContext().getUser())
                }
            ])
        ];

        var store = Ext.create('Rally.data.wsapi.Store', {
            model: 'Preference',
            filters: filters,
            sorters: [
                { property: 'Name', direction: 'ASC' }
            ],
            pageSize: 2000,
            limit: Infinity,
            fetch: [ 'Name', 'Type', 'Value', 'Project', 'User', 'Workspace', 'CreationDate'],
            context: {
                workspace: this.getContext().getWorkspaceRef(),
                project: null
            }
        });

        return store.load();
    },

    _bucketPrefsTogether: function(records) {
        this.preferenceModel = records && records.length && records[0].self;
        var bucket = {};  //charlie?
        _.each(records, function(record) {
            var name = record.get('Name');
            if (name.indexOf('rich-text-templates-template-') === 0) {
                var tokens = name.split('-');
                var id = tokens[4];
                bucket[id] = bucket[id] || {};
                if (tokens[5] === 'name') {
                    bucket[id].Name = record.get('Value');
                } else if (tokens[5] === 'value') {
                    delete record.raw.Name;
                    Ext.apply(bucket[id], record.raw);
                }
            } else if(name.indexOf('rich-text-templates-default') === 0) {

            }
        });

        return _.values(bucket);
    },

    _addGrid: function(records) {
         this.add({
            xtype: 'rallygrid',
            columnCfgs: [
                'Name',
                //'Type',
                'Value',
                'Project',
                'User',
                'Workspace'
            ],
            context: this.getContext(),
            enableEditing: false,
            showRowActionsColumn: true,
            store: Ext.create('Rally.data.custom.Store', {
                data: records,
                model: this.preferenceModel
            }),
        });
    }

    //TODO: Add copy to clipboard menu action
    //TODO: Disable edit/delete menu actions
    //TODO: Render a default for column
});
