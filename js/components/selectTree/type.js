/**
 * @flow
 */

export type itemType = {
  id?: string | number,
  name?: string,
  parent_id: string | number,
  parent_name: string,
  parent_territory_id: string | number,
  territory_id: string | number,
  territory_name: string,
};

export type subOption = {
  item: itemType,
  value: string | number,
  label: string,
};

export type composeOptionType = { [parent_territory_id: number | string]: Array<subOption> };
