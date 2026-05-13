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

import {useToast} from '@thunderid/contexts';
import {useLogger} from '@thunderid/logger/react';
import {Box, Chip, CircularProgress, Collapse, IconButton, Tooltip, Typography} from '@wso2/oxygen-ui';
import {ChevronDown, ChevronRight, FolderOpen, Plus, Trash2, Zap} from '@wso2/oxygen-ui-icons-react';
import {useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import type {AddNodeMode} from './AddNodeDialog';
import type {SelectedNode} from './ResourceTree';
import useDeleteAction from '@/api/useDeleteAction';
import useDeleteResource from '@/api/useDeleteResource';
import useGetResourceActions from '@/api/useGetResourceActions';
import useGetResources from '@/api/useGetResources';
import type {Action, Resource} from '@/models/resource-server';

interface ResourceTreeNodeProps {
  resourceServerId: string;
  delimiter: string;
  node: Resource;
  depth: number;
  selectedNodeId: string | null;
  onSelect: (node: SelectedNode) => void;
  onAddChild: (mode: AddNodeMode, parentResourceId: string, parentPermission: string) => void;
}

export function ResourceNode({
  resourceServerId,
  delimiter,
  node,
  depth,
  selectedNodeId,
  onSelect,
  onAddChild,
}: ResourceTreeNodeProps): JSX.Element {
  const {t} = useTranslation();
  const {showToast} = useToast();
  const logger = useLogger('ResourceNode');
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const deleteResource = useDeleteResource(resourceServerId);

  const {data: childResources} = useGetResources(resourceServerId, node.id, );
  const {data: resourceActions} = useGetResourceActions(resourceServerId, node.id, expanded);

  const isSelected = selectedNodeId === node.id;
  const children = childResources?.resources ?? [];
  const actions = resourceActions?.actions ?? [];

  const handleDelete = (e: React.MouseEvent): void => {
    e.stopPropagation();
    deleteResource.mutate(node.id, {
      onSuccess: () => showToast(t('apis:tree.deleteResource.success', 'Resource deleted.'), 'success'),
      onError: (err: Error) => {
        logger.error('Failed to delete resource', {error: err});
        showToast(t('apis:tree.deleteResource.error', 'Cannot delete — remove child resources and actions first.'), 'error');
      },
    });
  };

  return (
    <Box>
      <Box
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect({type: 'resource', id: node.id, data: node})}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          pl: depth * 2 + 0.5,
          pr: 0.5,
          py: 0.25,
          borderRadius: 1,
          cursor: 'pointer',
          bgcolor: isSelected ? 'action.selected' : hovered ? 'action.hover' : 'transparent',
          '&:hover': {bgcolor: isSelected ? 'action.selected' : 'action.hover'},
        }}
      >
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          sx={{p: 0.25, flexShrink: 0}}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </IconButton>

        <FolderOpen size={14} style={{flexShrink: 0, opacity: 0.7}} />

        <Typography variant="body2" sx={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
          {node.name}
        </Typography>

        <Chip
          label={node.permission}
          size="small"
          variant="outlined"
          sx={{fontFamily: 'monospace', fontSize: '0.68rem', height: 18, flexShrink: 0, opacity: hovered || isSelected ? 1 : 0.55}}
        />

        {hovered && (
          <Box sx={{display: 'flex', gap: 0.25, flexShrink: 0}} onClick={(e) => e.stopPropagation()}>
            <Tooltip title={t('apis:tree.addSubResource', 'Add sub-resource')}>
              <IconButton size="small" sx={{p: 0.25}} onClick={() => onAddChild('sub-resource', node.id, node.permission)}>
                <Plus size={12} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('apis:tree.addAction', 'Add action')}>
              <IconButton size="small" sx={{p: 0.25}} onClick={() => onAddChild('resource-action', node.id, node.permission)}>
                <Zap size={12} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('common:delete', 'Delete')}>
              <IconButton size="small" sx={{p: 0.25}} onClick={handleDelete} disabled={deleteResource.isPending}>
                {deleteResource.isPending ? <CircularProgress size={10} /> : <Trash2 size={12} />}
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      <Collapse in={expanded}>
        {actions.map((action) => (
          <ActionNode
            key={action.id}
            resourceServerId={resourceServerId}
            action={action}
            depth={depth + 1}
            parentResourceId={node.id}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
          />
        ))}
        {children.map((child) => (
          <ResourceNode
            key={child.id}
            resourceServerId={resourceServerId}
            delimiter={delimiter}
            node={child}
            depth={depth + 1}
            selectedNodeId={selectedNodeId}
            onSelect={onSelect}
            onAddChild={onAddChild}
          />
        ))}
      </Collapse>
    </Box>
  );
}

interface ActionNodeProps {
  resourceServerId: string;
  action: Action;
  depth: number;
  parentResourceId?: string;
  selectedNodeId: string | null;
  onSelect: (node: SelectedNode) => void;
}

export function ActionNode({
  resourceServerId,
  action,
  depth,
  parentResourceId = undefined,
  selectedNodeId,
  onSelect,
}: ActionNodeProps): JSX.Element {
  const {t} = useTranslation();
  const {showToast} = useToast();
  const logger = useLogger('ActionNode');
  const [hovered, setHovered] = useState(false);

  const deleteAction = useDeleteAction(resourceServerId, parentResourceId);
  const isSelected = selectedNodeId === action.id;
  const nodeType: SelectedNode['type'] = parentResourceId ? 'resource-action' : 'server-action';

  const handleDelete = (e: React.MouseEvent): void => {
    e.stopPropagation();
    deleteAction.mutate(action.id, {
      onSuccess: () => showToast(t('apis:tree.deleteAction.success', 'Action deleted.'), 'success'),
      onError: (err: Error) => {
        logger.error('Failed to delete action', {error: err});
        showToast(t('apis:tree.deleteAction.error', 'Failed to delete action.'), 'error');
      },
    });
  };

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect({type: nodeType, id: action.id, data: action, parentResourceId})}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        pl: depth * 2 + 2,
        pr: 0.5,
        py: 0.25,
        borderRadius: 1,
        cursor: 'pointer',
        bgcolor: isSelected ? 'action.selected' : hovered ? 'action.hover' : 'transparent',
      }}
    >
      <Zap size={13} style={{flexShrink: 0, opacity: 0.6}} />

      <Typography variant="body2" sx={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem'}}>
        {action.name}
      </Typography>

      <Chip
        label={action.permission}
        size="small"
        variant="outlined"
        sx={{fontFamily: 'monospace', fontSize: '0.68rem', height: 18, flexShrink: 0, opacity: hovered || isSelected ? 1 : 0.55}}
      />

      {hovered && (
        <Box sx={{display: 'flex', flexShrink: 0}} onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t('common:delete', 'Delete')}>
            <IconButton size="small" sx={{p: 0.25}} onClick={handleDelete} disabled={deleteAction.isPending}>
              {deleteAction.isPending ? <CircularProgress size={10} /> : <Trash2 size={12} />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}
