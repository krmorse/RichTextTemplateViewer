Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
        //((((Project = "https://rally1.rallydev.com/slm/webservice/v2.x/project/22900723577") OR (User = "/user/1973525753")) OR (Workspace = "https://rally1.rallydev.com/slm/webservice/v2.x/workspace/41529001")) AND ((Name contains "rich-text-templates-
        // this.add({
        //     xtype: 'rallygrid',
        //     columnCfgs: [
        //         'Name',
        //         'Type',
        //         'Value',
        //         'Project',
        //         'User',
        //         'Workspace'
        //     ],
        //     context: this.getContext(),
        //     enableEditing: false,
        //     showRowActionsColumn: false,
        //     storeConfig: {
        //         model: 'Preference',
        //         filters: filters
        //     }
        // });

        this._loadTemplatePreferences().then({
            success: this._bucketPrefsTogether,
            scope: this
        });
    },

    _loadTemplatePreferences: function() {
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
        var bucket = {};  //charlie?
        _.each(records, function(record) {
            var name = record.get('Name');
            if (name.indexOf('rich-text-templates-template-') === 0) {
                var tokens = name.split('-');
                var id = tokens[4];
                bucket[id] = bucket[id] || {};
                if (tokens[5] === 'name') {
                    bucket[id].Name = record.get('Value');
                } else {
                    debugger;
                }
            } else if(name.indexOf('rich-text-templates-default') === 0) {

            }
        });

    }
});
