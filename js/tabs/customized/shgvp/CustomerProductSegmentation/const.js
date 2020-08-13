const CUSTOMER_SEGMENTATION = 'customer_segmentation_history_list';

const default_field_val = [
  {
    val: '0',
    field: 'status',
  },
  {
    val: 'return _.now()',
    field: 'submit_time',
    field_type: 'js',
  },
];

export { CUSTOMER_SEGMENTATION, default_field_val };
