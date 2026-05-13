/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {Box, Chip, CircularProgress, Divider, IconButton, Paper, Tooltip, Typography} from '@wso2/oxygen-ui';
import {Plus, Shield, Zap} from '@wso2/oxygen-ui-icons-react';
import {useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import AddNodeDialog, {type AddNodeMode} from './AddNodeDialog';
import ResourceDetailPanel from './ResourceDetailPanel';
import {ActionNode, ResourceNode} from './ResourceTreeNode';
import useGetResources from '@/api/useGetResources';
import useGetServerActions from '@/api/useGetServerActions';
import type {Action, Resource, ResourceServer} from '@/models/resource-server';

export type SelectedNode =
  | {type: 'server'; id: string; data: ResourceServer}
  | {type: 'resource'; id: string; data: Resource}
  | {type: 'server-action'; id: string; data: Action; parentResourceId?: string}
  | {type: 'resource-action'; id: string; data: Action; parentResourceId?: string};

interface ResourceTreeProps {
  resourceServer: ResourceServer;
  onRefresh: () => void;
}

export default function ResourceTree({resourceServer, onRefresh}: ResourceTreeProps): JSX.Element {
  const {t} = useTranslation();
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>({
    type: 'server',
    id: resourceServer.id,
    data: resourceServer,
  });
  const [addDialog, setAddDialog] = useState<{
    mode: AddNodeMode;
    parentResourceId?: string;
    parentPermission: string;
  } | null>(null);
  const [serverHovered, setServerHovered] = useState(false);

  const {data: topLevelResources, isLoading: loadingResources} = useGetResources(resourceServer.id);
  const {data: serverActionsData, isLoading: loadingActions} = useGetServerActions(resourceServer.id);

  const resources = topLevelResources?.resources ?? [];
  const serverActions = serverActionsData?.actions ?? [];

  const openAdd = (mode: AddNodeMode, parentResourceId?: string, parentPermission?: string): void => {
    setAddDialog({
      mode,
      parentResourceId,
      parentPermission: parentPermission ?? resourceServer.handle,
    });
  };

  const isLoading = loadingResources || loadingActions;

  return (
    <Box sx={{display: 'flex', gap: 2, height: '100%'}}>
      {/* Left: Tree */}
      <Paper
        variant="outlined"
        sx={{
          width: 360,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{px: 1.5, py: 1, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider'}}>
          <Typography variant="caption" color="text.secondary" sx={{textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600}}>
            {t('apis:tree.title', 'Resource Hierarchy')}
          </Typography>
        </Box>

        <Box sx={{flex: 1, overflowY: 'auto', p: 0.5}}>
          {isLoading ? (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              {/* Root: API (Resource Server) node */}
              <Box
                onMouseEnter={() => setServerHovered(true)}
                onMouseLeave={() => setServerHovered(false)}
                onClick={() => setSelectedNode({type: 'server', id: resourceServer.id, data: resourceServer})}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 0.5,
                  py: 0.5,
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: selectedNode?.id === resourceServer.id && selectedNode.type === 'server'
                    ? 'action.selected'
                    : serverHovered ? 'action.hover' : 'transparent',
                }}
              >
                <Shield size={15} style={{flexShrink: 0}} />
                <Typography variant="body2" fontWeight={500} sx={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                  {resourceServer.name}
                </Typography>
                <Chip
                  label={resourceServer.handle}
                  size="small"
                  sx={{fontFamily: 'monospace', fontSize: '0.7rem', height: 18, flexShrink: 0}}
                />
                {serverHovered && (
                  <Box sx={{display: 'flex', gap: 0.25, flexShrink: 0}} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title={t('apis:tree.addResource', 'Add resource')}>
                      <IconButton size="small" sx={{p: 0.25}} onClick={() => openAdd('resource')}>
                        <Plus size={12} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('apis:tree.addServerAction', 'Add API-level action')}>
                      <IconButton size="small" sx={{p: 0.25}} onClick={() => openAdd('server-action')}>
                        <Zap size={12} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>

              <Divider sx={{my: 0.5}} />

              {/* Server-level actions */}
              {serverActions.map((action) => (
                <ActionNode
                  key={action.id}
                  resourceServerId={resourceServer.id}
                  action={action}
                  depth={1}
                  selectedNodeId={selectedNode?.id ?? null}
                  onSelect={setSelectedNode}
                />
              ))}

              {/* Top-level resources */}
              {resources.map((resource) => (
                <ResourceNode
                  key={resource.id}
                  resourceServerId={resourceServer.id}
                  delimiter={resourceServer.delimiter}
                  node={resource}
                  depth={1}
                  selectedNodeId={selectedNode?.id ?? null}
                  onSelect={setSelectedNode}
                  onAddChild={(mode, parentResourceId, parentPermission) =>
                    openAdd(mode, parentResourceId, parentPermission)
                  }
                />
              ))}

              {resources.length === 0 && serverActions.length === 0 && (
                <Box sx={{py: 3, textAlign: 'center'}}>
                  <Typography variant="body2" color="text.disabled">
                    {t('apis:tree.empty', 'No resources yet. Hover over the API name to add one.')}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* Right: Detail Panel */}
      <Paper variant="outlined" sx={{flex: 1, overflow: 'hidden'}}>
        <ResourceDetailPanel
          selectedNode={selectedNode}
          resourceServer={resourceServer}
          onRefresh={onRefresh}
        />
      </Paper>

      {addDialog && (
        <AddNodeDialog
          open={true}
          mode={addDialog.mode}
          resourceServerId={resourceServer.id}
          parentResourceId={addDialog.parentResourceId}
          parentPermission={addDialog.parentPermission}
          delimiter={resourceServer.delimiter}
          onClose={() => setAddDialog(null)}
          onSuccess={() => setAddDialog(null)}
        />
      )}
    </Box>
  );
}
