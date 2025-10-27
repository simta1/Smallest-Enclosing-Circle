#include <bits/stdc++.h>
using namespace std;

const double eps = 1e-9;

bool eq(double a, double b) {
	return abs(a - b) < eps;
}

int main() {
    double a = 0.1 + 0.2;
    double b = 0.3;

    cout << "a = " << a << "\n";
    cout << "b = " << b << "\n";
	cout << "\n";

	cout << "if (a == b)\t\t\t\t->\t";
	if (a == b) cout << "true\n";
	else cout << "false\n";
	cout << "\n";

	cout << "if (abs(a - b) < eps)\t->\t";
	if (eq(a, b)) cout << "true\n";
	else cout << "false\n";
	cout << "\n";

    // cout << fixed << setprecision(17);
    // cout << "a = " << a << "\n";
    // cout << "b = " << b << "\n";

	return 0;
}
