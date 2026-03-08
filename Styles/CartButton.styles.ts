import { StyleSheet, Platform } from 'react-native';

export const cartButtonStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#3d6b22',
    borderRadius: 8,
  },
  btnDisabled: {
    backgroundColor: '#e0e0e0',
  },
  btnQty: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: '#3d6b22',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  btnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  btnTextDisabled: {
    color: '#aaa',
  },
  cartIcon: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});